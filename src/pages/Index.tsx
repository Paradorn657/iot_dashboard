import { useEffect, useState } from 'react';
import { Container, Typography, CircularProgress, Grid, Paper, Box, Button } from '@mui/material';
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
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishStatus, setPublishStatus] = useState<{
    success: boolean;
    message: string;
    visible: boolean;
  }>({
    success: false,
    message: "",
    visible: false
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
          const rainValue = response.data?.rain || null;
          const timestamp = new Date().toLocaleTimeString();

          updatedRainData[deviceKey].push({
            rain: rainValue,
            timestamp,
          });

          if (updatedRainData[deviceKey].length > 10) {
            updatedRainData[deviceKey] = updatedRainData[deviceKey].slice(-10);
          }

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
    // เพิ่มระยะเวลา interval เพื่อป้องกัน 429 error
    const interval = setInterval(fetchRainData, 10000); // อัปเดตทุก 10 วินาที
    return () => clearInterval(interval);
  }, [rainValues]);

  // ฟังก์ชันสำหรับส่งข้อมูลไปยัง API ของ Express
  const publishRainData = async () => {
    setPublishLoading(true);
    setPublishStatus({ ...publishStatus, visible: false });

    try {
      const response = await fetch('http://localhost:5174/publish', { // ระบุ URL ที่ถูกต้อง
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ "moduleId": 2, "data": { "rain": 555 } }),
      });

      if (response.ok) {
        setPublishStatus({
          success: true,
          message: 'ส่งข้อมูลน้ำฝน 555 ไปยัง API Express สำเร็จ',
          visible: true,
        });
      } else {
        setPublishStatus({
          success: false,
          message: 'เกิดข้อผิดพลาดในการส่งข้อมูลไปยัง API Express',
          visible: true,
        });
      }
    } catch (error) {
      console.error('Error publishing rain data to Express API:', error);
      setPublishStatus({
        success: false,
        message: `เกิดข้อผิดพลาด: ${error.message || 'ไม่สามารถส่งข้อมูลได้'}`,
        visible: true,
      });
    } finally {
      setPublishLoading(false);

      // ซ่อนข้อความสถานะหลังจาก 5 วินาที
      setTimeout(() => {
        setPublishStatus((prev) => ({ ...prev, visible: false }));
      }, 5000);
    }
  };

  const cancelpublishRainData = async () => {
    setPublishLoading(true);
    setPublishStatus({ ...publishStatus, visible: false });

    try {
      const response = await fetch('http://localhost:5174/cancel-publish', { // ระบุ URL ที่ถูกต้อง
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ "moduleId": 2, "data": { "rain": 1024 } }),
      });

      if (response.ok) {
        setPublishStatus({
          success: true,
          message: 'ยกเลิก ไปยัง API Express สำเร็จ',
          visible: true,
        });
      } else {
        setPublishStatus({
          success: false,
          message: 'เกิดข้อผิดพลาดในการยกเลิก API Express',
          visible: true,
        });
      }
    } catch (error) {
      console.error('Error publishing rain data to Express API:', error);
      setPublishStatus({
        success: false,
        message: `เกิดข้อผิดพลาด: ${error.message || 'ไม่สามารถส่งข้อมูลได้'}`,
        visible: true,
      });
    } finally {
      setPublishLoading(false);

      // ซ่อนข้อความสถานะหลังจาก 5 วินาที
      setTimeout(() => {
        setPublishStatus((prev) => ({ ...prev, visible: false }));
      }, 5000);
    }
  };


  // เกณฑ์ค่าน้ำฝนที่ปรับปรุงตามความต้องการ
  const getRainStatus = (value: number | null) => {
    if (value === null) return "ไม่มีข้อมูล";
    if (value >= 800 && value <= 1024) return "ไม่มีฝน";
    if (value >= 400 && value < 800) return "ฝนเล็กน้อย";
    if (value > 0 && value < 400) return "ฝนตกหนัก";
    return "ไม่สามารถระบุสถานะได้";
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
      <Box my={4} >
        <Typography variant="h4" gutterBottom style={{ textAlign: 'center' }}>
          ระบบติดตามข้อมูลน้ำฝน
        </Typography>
        
          {/* ปุ่มส่งข้อมูลน้ำฝน */}
          <Box display="flex" flexDirection="column" gap={1} alignItems="center" mb={4}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={publishRainData}
              disabled={publishLoading}
              style={{ minWidth: '250px' }}
            >
              {publishLoading ? (
                <>
                  <CircularProgress size={24} color="inherit" style={{ marginRight: '10px' }} />
                  กำลังส่งข้อมูล...
                </>
              ) : (
                "ส่งค่าน้ำฝน 555 ไปยังทุกอุปกรณ์"
              )}
            </Button>

            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={cancelpublishRainData}
              disabled={publishLoading}
              style={{ minWidth: '250px' }}
            >
              {publishLoading ? (
                <>
                  <CircularProgress size={24} color="inherit" style={{ marginRight: '10px' }} />
                  กำลังส่งข้อมูล...
                </>
              ) : (
                "ยกเลิก"
              )}
            </Button>

            {/* แสดงสถานะการส่งข้อมูล */}
            {publishStatus.visible && (
              <Paper
                elevation={1}
                style={{
                  marginTop: '10px',
                  padding: '8px 16px',
                  backgroundColor: publishStatus.success ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                  color: publishStatus.success ? '#388e3c' : '#d32f2f',
                  transition: 'all 0.3s ease'
                }}
              >
                <Typography>{publishStatus.message}</Typography>
              </Paper>
            )}
        </Box>
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
                      backgroundColor: latestReadings[deviceKey] !== null &&
                        ((latestReadings[deviceKey]! >= 400 && latestReadings[deviceKey]! < 800) ||
                          (latestReadings[deviceKey]! > 0 && latestReadings[deviceKey]! < 400))
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