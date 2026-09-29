// src/components/MagneticButton.tsx
import { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import type { ReactNode, MouseEvent } from 'react';

interface MagneticButtonProps {
  as?: 'button' | 'a';
  href?: string;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
  type?: 'button' | 'submit';
}

const MagneticButton = ({
  as = 'button',
  href,
  onClick,
  className,
  children,
  type = 'button',
}: MagneticButtonProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 200, damping: 14 });
  const springY = useSpring(y, { stiffness: 200, damping: 14 });

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = event.clientX - rect.left - rect.width / 2;
    const relY = event.clientY - rect.top - rect.height / 2;
    x.set(relX * 0.25);
    y.set(relY * 0.35);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const Content =
    as === 'a' ? (
      <a href={href} className={className} onClick={onClick}>
        {children}
      </a>
    ) : (
      <button type={type} className={className} onClick={onClick}>
        {children}
      </button>
    );

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY, display: 'inline-block' }}
      whileTap={{ scale: 0.97 }}
    >
      {Content}
    </motion.div>
  );
};

export default MagneticButton;