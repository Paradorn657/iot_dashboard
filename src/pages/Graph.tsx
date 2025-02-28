import { useEffect, useState } from 'react';
import MQTT from 'paho-mqtt';

const NETPIE_BROKER = 'wss://broker.netpie.io:8883'; // Secure WebSocket port
const DEVICE_ID = '77cb8477-dcdd-4f1a-976d-ef8f001669c6'; // Device ID ที่ได้รับจาก Netpie
const USERNAME = 'pkVQJRzz8KqQgJvuzM5XYWjY395NTLoA';
const PASSWORD = 'gVmPKuPYzsPNAafJQFgMyMAomAt1RR8a';
const TOPIC_PUBLISH = '@msg/rain';
const TOPIC_SUBSCRIBE = '@shadow/data/update';

function MQTTComponent() {
  const [mqttClient, setMqttClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false); // Track if MQTT is connected
  const [rainData, setRainData] = useState(null);

  useEffect(() => {
    const client = new MQTT.Client(NETPIE_BROKER, DEVICE_ID);
    client.connect({
      onSuccess: () => {
        console.log('MQTT Connected');
        setIsConnected(true); // Set connected state to true
        client.subscribe(TOPIC_SUBSCRIBE);
      },
      userName: USERNAME,
      password: PASSWORD,
      onFailure: (error) => {
        console.error('MQTT Connection Failed', error);
      }
    });

    client.onMessageArrived = (message) => {
      console.log('Message received:', message.payloadString);
      setRainData(JSON.parse(message.payloadString));
    };

    setMqttClient(client);

    return () => {
      if (client.isConnected()) {
        client.disconnect();
      }
    };
  }, []);

  const publishRainData = () => {
    if (isConnected && mqttClient) {
      const message = new MQTT.Message(JSON.stringify({ rain: 600 }));
      message.destinationName = TOPIC_PUBLISH;
      mqttClient.send(message);
      console.log('Published rain data to @msg/rain');
    } else {
      console.error('MQTT Client is not connected');
    }
  };

  return (
    <div>
      <button onClick={publishRainData} disabled={!isConnected}>
        {isConnected ? 'ส่งข้อมูลน้ำฝนไปยังอุปกรณ์' : 'กำลังเชื่อมต่อ...'}
      </button>
      <div>
        <h3>ข้อมูลน้ำฝนล่าสุด:</h3>
        {rainData ? <p>ฝน: {rainData.rain}</p> : <p>กำลังโหลดข้อมูล...</p>}
      </div>
    </div>
  );
}

export default MQTTComponent;
