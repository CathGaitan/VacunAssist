import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';

//import './index.css';

/* comento lo que estoy probando 
ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById('root')
  );
*/ 

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render( <React.StrictMode> <App/></React.StrictMode>);
 

reportWebVitals();
