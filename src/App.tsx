import './App.css';
import InfiniteCanvas from './components/InfiniteCanvas';

export default function App() {
  return (
    
    <div className="w-full h-screen bg-white flex">
      <div className='head'>
        <button></button>
      </div>
      <div className="flex-1 h-full">
        <InfiniteCanvas />
      </div>
    </div>
  );
}