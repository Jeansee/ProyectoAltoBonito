import { motion } from 'framer-motion';
import styles from './HomeComponents.module.css';

const HeroSection = () => (
  <motion.header 
    className={styles.hero}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8 }}
  >
    <div className={styles.heroOverlay} />
    <div className={styles.heroContent}>
      <motion.h1 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        Quincho Alto Bonito
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        El mejor lugar para tus celebraciones
      </motion.p>
      <motion.button
        className={styles.heroButton}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Conoce más
      </motion.button>
    </div>
  </motion.header>
);

export default HeroSection;