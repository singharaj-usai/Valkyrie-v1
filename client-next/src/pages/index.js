import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/hello');
        const jsonData = await res.json();

        if (!res.ok) {
          throw new Error(jsonData.error || 'Failed to fetch data');
        }

        setData(jsonData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      }
    };

    fetchData();
  }, []);

  return (
    <div className="container" style={{ marginTop: '100px' }}>
      <div className="row">
        <div className="col-md-12">
          <div className="panel panel-primary">
            <div className="panel-heading">
              <h3 className="panel-title">Welcome {user ? user.username : 'Guest'}</h3>
            </div>
            <div className="panel-body">
              <p>Next.js with Bootstrap 3</p>
              {error ? (
                <div className="alert alert-danger">{error}</div>
              ) : (
                data && <pre>{JSON.stringify(data, null, 2)}</pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}