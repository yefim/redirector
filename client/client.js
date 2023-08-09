import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  const [data, setData] = useState();

  useEffect(() => {
    async function fetchData() {
      const res = await fetch('http://httpbin.org/get');
      const resData = await res.json();
      setData(resData);
    }
    fetchData();
  }, []);

  return (
    <div>
    <h1>hello</h1>
      {
        data ? (
          <pre>
            {JSON.stringify(data, null, 2)}
          </pre>
        ) : <span>Loading...</span>}
      </div>
  );
}


const domNode = document.getElementById('app');
const root = createRoot(domNode);

root.render(<App />);
