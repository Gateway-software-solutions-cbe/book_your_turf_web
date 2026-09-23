// src/components/LogoAnimation.tsx
import { Player } from '@lottiefiles/react-lottie-player';
import splashAnimation from "../../asset/BYT_2_CP_splash.json";


const LogoAnimation = ({ size = 90 }) => {
  return (
    <div
      className="byt-logo__lottie"
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
      aria-label="Book Your Turf"
      role="img"
    >
      <Player
        loop={true}
  autoplay={true}
        src={splashAnimation}
        style={{ width: '100%', height: '100%' }}
        rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
      />
    </div>
  );
};

export default LogoAnimation;