import { ThemeProvider } from '@/contexts/ThemeContext';
import { Header } from '@/components/Header';
import { Canvas } from '@/components/Canvas';
import '@/styles/global.css';

function App() {
  return (
    <ThemeProvider>
      <div className="app">
        <Header username="John Doe" logoText="Dashboard" />
        <Canvas />
      </div>
    </ThemeProvider>
  );
}

export default App;
