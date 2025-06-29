const express = require('express');
const cors = require('cors');
const stationRoutes = require('./src/routes/stations').default;

const app = express();

app.use(cors({
  origin: 'http://localhost:5177',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use(express.json());
app.use('/api/stationen', stationRoutes);

app.listen(3001, () => console.log('Server running on port 3001'));
