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
  const [isPublished, setIsPublished] = useState(false);  // เพิ่มสถานะการส่งข้อมูล
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
      const response = await fetch('http://localhost:5174/publish', {
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
        setIsPublished(true); // อัพเดทสถานะว่าได้ส่งข้อมูลแล้ว
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

  const cancelPublishRainData = async () => {
    setPublishLoading(true);
    setPublishStatus({ ...publishStatus, visible: false });

    try {
      const response = await fetch('http://localhost:5174/cancel-publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ "moduleId": 2, "data": { "rain": 1024 } }),
      });

      if (response.ok) {
        setPublishStatus({
          success: true,
          message: 'ยกเลิกการส่งข้อมูลไปยัง API Express สำเร็จ',
          visible: true,
        });
        setIsPublished(false); // อัพเดทสถานะว่าได้ยกเลิกการส่งข้อมูลแล้ว
      } else {
        setPublishStatus({
          success: false,
          message: 'เกิดข้อผิดพลาดในการยกเลิกการส่งข้อมูลไปยัง API Express',
          visible: true,
        });
      }
    } catch (error) {
      console.error('Error cancelling rain data to Express API:', error);
      setPublishStatus({
        success: false,
        message: `เกิดข้อผิดพลาด: ${error.message || 'ไม่สามารถยกเลิกการส่งข้อมูลได้'}`,
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

  // ฟังก์ชันสำหรับกำหนดสีของสถานะน้ำฝน
  const getRainStatusColor = (value: number | null) => {
    if (value === null) return "#9e9e9e"; // สีเทา
    if (value >= 800 && value <= 1024) return "#4caf50"; // สีเขียว
    if (value >= 400 && value < 800) return "#ff9800"; // สีส้ม
    if (value > 0 && value < 400) return "#f44336"; // สีแดง
    return "#9e9e9e"; // สีเทา
  };

  // Custom tooltip สำหรับกราฟ
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper style={{ padding: '10px', backgroundColor: 'rgba(255, 255, 255, 0.9)', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <Typography variant="body2" style={{ fontWeight: 'bold' }}>เวลา: {label}</Typography>
          <Typography variant="body2" color={payload[0].color} style={{ margin: '5px 0' }}>
            ค่าน้ำฝน: {payload[0].value !== null ? payload[0].value : 'ไม่มีข้อมูล'}
          </Typography>
          <Typography 
            variant="body2" 
            style={{ 
              color: getRainStatusColor(payload[0].value),
              fontWeight: 'bold'
            }}
          >
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
        <Typography variant="h4" gutterBottom style={{ textAlign: 'center', fontWeight: 'bold', color: '#3f51b5', marginBottom: '24px' }}>
          ระบบติดตามข้อมูลน้ำฝน
        </Typography>
        
        {/* ปุ่มส่งข้อมูลน้ำฝนและยกเลิก */}
        <Box 
          display="flex" 
          flexDirection="column"
          gap={2} 
          alignItems="center" 
          mb={4} 
          sx={{
            backgroundColor: 'rgba(63, 81, 181, 0.05)',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '30px'
          }}
        >
          <Typography variant="h6" style={{ marginBottom: '10px' }}>การควบคุมอุปกรณ์</Typography>
          
          <Box display="flex" gap={2} width="100%" maxWidth="500px" justifyContent="center">
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={publishRainData}
              disabled={publishLoading || isPublished} // ปิดการใช้งานเมื่อกำลังส่งข้อมูลหรือได้ส่งข้อมูลแล้ว
              fullWidth
              sx={{
                py: 1.5,
                borderRadius: '8px',
                fontWeight: 'bold',
                boxShadow: '0 4px 8px rgba(63, 81, 181, 0.2)',
                backgroundColor: isPublished ? 'rgba(63, 81, 181, 0.3)' : '#3f51b5',
                '&:hover': {
                  backgroundColor: '#303f9f'
                }
              }}
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
              color="error"
              size="large"
              onClick={cancelPublishRainData}
              disabled={publishLoading || !isPublished} // ปิดการใช้งานเมื่อกำลังส่งข้อมูลหรือยังไม่ได้ส่งข้อมูล
              fullWidth
              sx={{
                py: 1.5,
                borderRadius: '8px',
                fontWeight: 'bold',
                boxShadow: '0 4px 8px rgba(244, 67, 54, 0.2)',
                backgroundColor: !isPublished ? 'rgba(244, 67, 54, 0.3)' : '#f44336',
                '&:hover': {
                  backgroundColor: '#d32f2f'
                }
              }}
            >
              {publishLoading ? (
                <>
                  <CircularProgress size={24} color="inherit" style={{ marginRight: '10px' }} />
                  กำลังยกเลิก...
                </>
              ) : (
                "ยกเลิกการส่งข้อมูล"
              )}
            </Button>
          </Box>

          {/* แสดงสถานะการส่งข้อมูล */}
          {publishStatus.visible && (
            <Paper
              elevation={3}
              style={{
                width: '100%',
                maxWidth: '500px',
                padding: '12px 20px',
                backgroundColor: publishStatus.success ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                color: publishStatus.success ? '#388e3c' : '#d32f2f',
                borderLeft: publishStatus.success ? '4px solid #388e3c' : '4px solid #d32f2f',
                borderRadius: '4px',
                transition: 'all 0.3s ease'
              }}
            >
              <Typography fontWeight="medium">{publishStatus.message}</Typography>
            </Paper>
          )}
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" my={6} flexDirection="column" alignItems="center">
            <CircularProgress size={48} />
            <Typography variant="body1" mt={2}>กำลังโหลดข้อมูลน้ำฝน...</Typography>
          </Box>
        ) : (
          <>
            {/* Dashboard สรุปข้อมูลล่าสุด */}
            <Grid container spacing={3} mb={4}>
              {Object.keys(latestReadings).map((deviceKey, index) => {
                const rainValue = latestReadings[deviceKey];
                const statusColor = getRainStatusColor(rainValue);
                
                return (
                <Grid item xs={12} md={6} key={deviceKey}>
                  <Paper
                    elevation={3}
                    style={{
                      padding: '24px',
                      textAlign: 'center',
                      borderRadius: '8px',
                      borderTop: `5px solid ${DEVICE_COLORS[index]}`,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}
                  >
                    <Typography variant="h6" fontWeight="bold" color={DEVICE_COLORS[index]}>
                      {DEVICE_NAMES[index]}
                    </Typography>
                    <Typography
                      variant="h3"
                      style={{
                        color: DEVICE_COLORS[index],
                        margin: '16px 0',
                        fontWeight: 'bold'
                      }}
                    >
                      {latestReadings[deviceKey] !== null ? latestReadings[deviceKey] : 'N/A'}
                    </Typography>
                    <Box 
                      sx={{
                        backgroundColor: `${statusColor}20`,
                        borderRadius: '20px',
                        padding: '6px 16px',
                        display: 'inline-block',
                        margin: '0 auto'
                      }}
                    >
                      <Typography 
                        variant="body1" 
                        fontWeight="medium"
                        style={{ color: statusColor }}
                      >
                        {getRainStatus(latestReadings[deviceKey])}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              )})}
            </Grid>

            {/* กราฟแยกตาม Device */}
            <Grid container spacing={3}>
              {Object.keys(rainValues).map((deviceKey, index) => (
                <Grid item xs={12} key={deviceKey}>
                  <Paper 
                    elevation={3} 
                    style={{ 
                      padding: '24px', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  >
                    <Typography variant="h6" gutterBottom fontWeight="bold" color={DEVICE_COLORS[index]}>
                      {DEVICE_NAMES[index]}
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={rainValues[deviceKey]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                        <XAxis
                          dataKey="timestamp"
                          type="category"
                          reversed={true}
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={{ stroke: '#e0e0e0' }}
                        />
                        <YAxis
                          label={{
                            value: 'ปริมาณน้ำฝน',
                            angle: -90,
                            position: 'insideLeft',
                            style: { textAnchor: 'middle', fill: '#666' }
                          }}
                          tickLine={false}
                          axisLine={{ stroke: '#e0e0e0' }}
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
                          activeDot={{ r: 8, strokeWidth: 0 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* กราฟรวม */}
            <Grid item xs={12} mt={3}>
              <Paper 
                elevation={3} 
                style={{ 
                  padding: '24px', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                <Typography variant="h6" gutterBottom fontWeight="bold">เปรียบเทียบข้อมูลทั้งหมด</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                    <XAxis
                      dataKey="timestamp"
                      type="category"
                      allowDuplicatedCategory={false}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: '#e0e0e0' }}
                    />
                    <YAxis
                      label={{
                        value: 'ปริมาณน้ำฝน',
                        angle: -90,
                        position: 'insideLeft',
                        style: { textAnchor: 'middle', fill: '#666' }
                      }}
                      tickLine={false}
                      axisLine={{ stroke: '#e0e0e0' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {Object.keys(rainValues).map((deviceKey, index) => (
                      <Line
                        key={deviceKey}
                        data={rainValues[deviceKey]}
                        type="monotone"
                        dataKey="rain"
                        stroke={DEVICE_COLORS[index]}
                        name={DEVICE_NAMES[index]}
                        strokeWidth={2}
                        dot={{ stroke: DEVICE_COLORS[index], strokeWidth: 2, r: 4 }}
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