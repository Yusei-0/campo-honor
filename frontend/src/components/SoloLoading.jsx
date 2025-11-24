import React, { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

const SoloLoading = ({ onNavigate }) => {
  const { socket } = useSocket();

  useEffect(() => {
    console.log('SoloLoading mounted. Socket:', socket);
    if (socket) {
      console.log('Socket connected:', socket.connected);
      
      // Listen for game start
      socket.on('game_start', (data) => {
        console.log('Solo game started event received:', data);
        onNavigate('game', data);
      });

      // Emit start solo game
      console.log('Emitting start_solo_game...');
      socket.emit('start_solo_game', 'Player');
    } else {
        console.error('Socket is null in SoloLoading!');
    }

    return () => {
      if (socket) {
        console.log('Cleaning up SoloLoading listeners');
        socket.off('game_start');
      }
    };
  }, [socket, onNavigate]);

  return (
    <div className="start-screen" style={{ color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h2>Preparando Batalla...</h2>
      <div className="spinner" style={{
          width: '50px',
          height: '50px',
          border: '5px solid rgba(255,255,255,0.3)',
          borderRadius: '50%',
          borderTopColor: '#fff',
          animation: 'spin 1s ease-in-out infinite',
          marginTop: '20px'
      }}></div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SoloLoading;
