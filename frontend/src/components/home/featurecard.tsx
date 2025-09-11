import { motion } from 'framer-motion';
import styles from './HomeComponents.module.css';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  delay: number;
}

const FeatureCard = ({ icon, title, description, delay }: FeatureCardProps) => (
  <motion.div 
    className={styles.featureCard}
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    viewport={{ once: true }}
  >
    <i className={`fas ${icon}`}></i>
    <h3>{title}</h3>
    <p>{description}</p>
  </motion.div>
);

export default FeatureCard;