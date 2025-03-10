#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <Servo.h>
#include <ArduinoJson.h>

const char* publish_topic = "@msg/rain";
const char* subscribe_topic = "@msg/rain";

const char* ssid = "iPhoneGay";
const char* password = "firstza007";
const char* mqtt_server = "broker.netpie.io";
const int mqtt_port = 1883;
const char* mqtt_Client = "9908b7d4-3938-4a81-ae46-3124c1c614f7";
const char* mqtt_username = "FUCX9SeXZ6FcSspLYDntP6Ek3uGyhLvB";
const char* mqtt_password = "ZsayBD3rJ4vd5egLqzcyKmWBYGa7pHKb";

const int servoPin = D5;       // Define the pin for the servo

WiFiClient espClient;
PubSubClient client(espClient);
Servo myServo;

long lastMsg = 0;
char msg[50];
char msg_fb[100];

// Define the maximum number of modules. Adjust as needed.
const int maxModules = 3;  // Can be changed to any number of modules
bool rainStatus[maxModules] = {false};  // For n modules
int moduleId = 2;  // Unique ID for this module (you can set this based on module)

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect(mqtt_Client, mqtt_username, mqtt_password)) {
      Serial.println("connected");
      client.subscribe(subscribe_topic); // Subscribe to rain topic from all devices
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void callback(char* topic, byte* payload, unsigned int length) {
    Serial.print("Message arrived [");
    Serial.print(topic);
    Serial.print("] ");

    // Convert payload to a string
    String receivedPayload;
    for (int i = 0; i < length; i++) {
        receivedPayload += (char)payload[i];
    }
    Serial.println(receivedPayload);

    // Parse JSON
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, receivedPayload);
    if (error) {
        Serial.println("JSON Parsing failed");
        return;
    }

    int receivedRainValue = doc["data"]["rain"];
    int receivedModuleId = doc["moduleId"];

    // Update rain status based on the received module data
    if (receivedModuleId >= 0 && receivedModuleId < maxModules) {
        rainStatus[receivedModuleId] = receivedRainValue < 800;  // If rain detected, mark as true
    }

    // Now decide whether any module detects rain
    bool rainDetected = false;
    for (int i = 0; i < maxModules; i++) {
        if (rainStatus[i]) {
            rainDetected = true;
            break;
        }
    }

    // Control the servo based on the overall rain detection
    if (rainDetected) {
        Serial.println("Rain detected! Closing cover.");
        myServo.write(0);  // Close cover
        digitalWrite(LED_BUILTIN, LOW);  // Turn LED ON (ESP8266 LED is active LOW)
    } else {
        Serial.println("No rain. Opening cover.");
        myServo.write(180);  // Open cover
        digitalWrite(LED_BUILTIN, HIGH); // Turn LED OFF
    }
}

void setup() {
  Serial.begin(115200);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
  myServo.attach(D5);
  pinMode(LED_BUILTIN, OUTPUT); // Initialize built-in LED
  digitalWrite(LED_BUILTIN, HIGH); // Turn LED off (ESP8266 LED is active LOW)
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  long now = millis();
  if (now - lastMsg > 5000) { // Send data every 5 seconds
      lastMsg = now;

      Serial.print("Rain Sensor Value: ");
  }
  delay(100); // Small delay to prevent CPU overuse
}