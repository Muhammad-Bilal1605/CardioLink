// backend/routes/zegoRoutes.js
app.post('/api/zego/generate-token', (req, res) => {
    const { userId, roomId } = req.body;
    const token = generateZegoToken(userId, roomId); // Implement this
    res.json({ token });
  });