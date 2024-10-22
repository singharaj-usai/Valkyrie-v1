export default function handler(req, res) {
  try {
    res.status(200).json({ message: 'Hello from API!' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}