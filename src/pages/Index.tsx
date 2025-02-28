import { useEffect, useState } from 'react';
import { Container, Typography, CircularProgress, Grid, Paper, Box } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

const NETPIE_API_URL = "https://api.netpie.io/v2/device/shadow/data";

// เก็บค่า authorization สำหรับแต่ละ device
const NETPIE_AUTH = [
  "Device 25351f7d-d6e5-4ab3-9467-d78ee0b25cbb:iS8gwS43LGR48xRrG3NxyzCYwhPNNZMx",
  "Device ce0cf211-6af5-4492-b1c4-a2477b0aea16:i8i9mPNJ37fUo75ZHHs3yieEXQ1bezLB",
];

// ชื่อที่แสดงสำหรับแต่ละ device
const DEVICE_NAMES = [
  "อุปกรณ์วัดน้ำฝนที่ 1",
  "อุปกรณ์วัดน้ำฝนที่ 2"
];

// สีสำหรับแต่ละ device
const DEVICE_COLORS = ["#3f51b5", "#f50057"];

function Index() {
  const [rainValues, setRainValues] = useState<{ [key: string]: { rain: number | null, timestamp: string }[] }>({
    Device1: [],
    Device2: []
  });
  const [loading, setLoading] = useState(true);
  const [latestReadings, setLatestReadings] = useState<{ [key: string]: number | null }>({
    Device1: null,
    Device2: null
  });

  useEffect(() => {
    const fetchRainData = async () => {
      try {
        const responses = await Promise.all(
          NETPIE_AUTH.map((auth) =>
            fetch(NETPIE_API_URL, {
              headers: { "Authorization": auth },
            }).then((response) => response.json())
          )
        );

        const updatedRainData: { [key: string]: { rain: number | null, timestamp: string }[] } = {
          Device1: [...rainValues.Device1],
          Device2: [...rainValues.Device2]
        };

        const newLatestReadings: { [key: string]: number | null } = { ...latestReadings };

        responses.forEach((response, index) => {
          const deviceKey = `Device${index + 1}`;
          const rainValue = response.data?.rain || 'loading...';
          const timestamp = new Date().toLocaleTimeString(); // เวลาเท่านั้นเพื่อความกระชับ
          
          // เก็บข้อมูลใหม่
          updatedRainData[deviceKey].push({
            rain: rainValue,
            timestamp,
          });
          
          // จำกัดข้อมูลให้แสดงเฉพาะ 10 ค่าล่าสุด
          if (updatedRainData[deviceKey].length > 10) {
            updatedRainData[deviceKey] = updatedRainData[deviceKey].slice(-10);
          }
          
          // อัปเดตค่าล่าสุด
          newLatestReadings[deviceKey] = rainValue;
        });

        setRainValues(updatedRainData);
        setLatestReadings(newLatestReadings);
      } catch (error) {
        console.error("Error fetching rain data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRainData();
    const interval = setInterval(fetchRainData, 5000); // อัปเดตทุก 2 วินาที
    return () => clearInterval(interval); // เคลียร์ interval เมื่อ component ถูก unmount
  }, [rainValues]);

  // คำนวณสถานะฝน
  const getRainStatus = (value: number | null) => {
    if (value === null) return "ไม่มีข้อมูล";
    if (value >= 800 && value <= 1024) return "ไม่มีฝน";
    if (value >= 400 && value < 800) return "ฝนเล็กน้อย";
    if (value > 0 && value < 400) return "ฝนตกหนัก";
    return "ไม่สามารถระบุสถานะได้"; // สำหรับกรณีที่ค่าอยู่นอกเงื่อนไขที่กำหนด (เช่น ค่าติดลบหรือเกิน 1024)
  };

  // Custom tooltip สำหรับกราฟ
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper style={{ padding: '10px', backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
          <Typography variant="body2">เวลา: {label}</Typography>
          <Typography variant="body2" color={payload[0].color}>
            ค่าน้ำฝน: {payload[0].value !== null ? payload[0].value : 'ไม่มีข้อมูล'}
          </Typography>
          <Typography variant="body2">
            สถานะ: {getRainStatus(payload[0].value)}
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Typography variant="h4" gutterBottom style={{ textAlign: 'center' }}>
          ระบบติดตามข้อมูลน้ำฝน
        </Typography>
        
        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Dashboard สรุปข้อมูลล่าสุด */}
            <Grid container spacing={3} mb={4}>
              {Object.keys(latestReadings).map((deviceKey, index) => (
                <Grid item xs={12} md={6} key={deviceKey}>
                  <Paper 
                    elevation={3} 
                    style={{ 
                      padding: '20px', 
                      textAlign: 'center',
                      backgroundColor: latestReadings[deviceKey] !== null && latestReadings[deviceKey]! > 30 
                        ? 'rgba(63, 81, 181, 0.1)' 
                        : 'white'
                    }}
                  >
                    <Typography variant="h6">{DEVICE_NAMES[index]}</Typography>
                    <Typography 
                      variant="h3" 
                      style={{ 
                        color: DEVICE_COLORS[index],
                        margin: '10px 0'
                      }}
                    >
                      {latestReadings[deviceKey] !== null ? latestReadings[deviceKey] : 'N/A'}
                    </Typography>
                    <Typography variant="body1">
                      สถานะ: {getRainStatus(latestReadings[deviceKey])}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* กราฟแยกตาม Device */}
            <Grid container spacing={3}>
              {Object.keys(rainValues).map((deviceKey, index) => (
                <Grid item xs={12} key={deviceKey}>
                  <Paper elevation={3} style={{ padding: '20px' }}>
                    <Typography variant="h6" gutterBottom>{DEVICE_NAMES[index]}</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={rainValues[deviceKey]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="timestamp" 
                          type="category" 
                          reversed={true} 
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          label={{ 
                            value: 'ปริมาณน้ำฝน', 
                            angle: -90, 
                            position: 'insideLeft',
                            style: { textAnchor: 'middle' }
                          }} 
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="rain" 
                          stroke={DEVICE_COLORS[index]} 
                          fill={DEVICE_COLORS[index]} 
                          fillOpacity={0.3}
                          name={DEVICE_NAMES[index]}
                          connectNulls
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* กราฟรวม */}
            <Grid item xs={12} mt={3}>
              <Paper elevation={3} style={{ padding: '20px' }}>
                <Typography variant="h6" gutterBottom>เปรียบเทียบข้อมูลทั้งหมด</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      type="category"
                      allowDuplicatedCategory={false}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      label={{ 
                        value: 'ปริมาณน้ำฝน', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { textAnchor: 'middle' }
                      }} 
                    />
                    <Tooltip />
                    <Legend />
                    {Object.keys(rainValues).map((deviceKey, index) => (
                      <Line 
                        key={deviceKey}
                        data={rainValues[deviceKey]} 
                        type="monotone" 
                        dataKey="rain" 
                        stroke={DEVICE_COLORS[index]} 
                        name={DEVICE_NAMES[index]}
                        dot={{ stroke: DEVICE_COLORS[index], strokeWidth: 2 }}
                        activeDot={{ r: 8 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </>
        )}
      </Box>
    </Container>
  );
}

export default Index;