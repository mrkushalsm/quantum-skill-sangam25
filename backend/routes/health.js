const router = require('express').Router();
const mongoose = require('mongoose');

/**
 * @swagger
 * /api/health:
 *   get:
 *     tags: [System]
 *     summary: Check system health
 *     description: Returns the current status of the API and database connection
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 database:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: connected
 *                     name:
 *                       type: string
 *                       example: armed_forces_welfare
 *                     collections:
 *                       type: number
 *                       example: 10
 *                     dataSize:
 *                       type: number
 *                       example: 1024000
 *                     uptime:
 *                       type: number
 *                       example: 3600
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2023-10-01T12:00:00.000Z
 *       503:
 *         description: Service Unavailable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Database connection failed
 *                     details:
 *                       type: string
 *                       example: connection to server failed
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2023-10-01T12:00:00.000Z
 */
router.get('/', async (req, res) => {
  try {
    // Check database connection
    await mongoose.connection.db.command({ ping: 1 });
    
    // Get some basic stats
    const stats = await mongoose.connection.db.stats();
    
    res.status(200).json({ 
      status: 'ok',
      database: {
        status: 'connected',
        name: mongoose.connection.name,
        collections: stats.collections,
        dataSize: stats.dataSize,
        uptime: stats.uptime
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'error',
      error: {
        message: 'Database connection failed',
        details: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
