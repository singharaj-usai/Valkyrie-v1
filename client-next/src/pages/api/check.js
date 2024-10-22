export default function handler(req, res) {
    try {
      // Temporary response until backend is connected
      res.status(200).json({
        authenticated: false,
        user: null
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }