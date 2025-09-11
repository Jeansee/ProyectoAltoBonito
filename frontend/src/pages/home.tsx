import { motion } from 'framer-motion';
import styles from './home.module.css';

const features = [
  {
    icon: 'fa-users',
    title: 'Capacidad',
    description: 'Espacio para 100 personas'
  },
  {
    icon: 'fa-utensils',
    title: 'Servicios',
    description: 'Parrilla y cocina equipada'
  },
  {
    icon: 'fa-mountain',
    title: 'Vista',
    description: 'Vista panorámica increíble'
  }
];

const HeroSection = () => (
  <header className={styles.hero}>
    <div className={styles.heroOverlay} />
    <div className={styles.heroContent}>
      <motion.h1 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.8 }}
      >
        Quincho Alto Bonito
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        El mejor lugar para tus celebraciones y eventos especiales.
      </motion.p>
      <motion.a
        href="#features"
        className={styles.heroButton}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        tabIndex={0}
        aria-label="Ir a características"
      >
        Descubre más
      </motion.a>
    </div>
  </header>
);

const FeatureCard = ({ icon, title, description, delay }: { icon: string; title: string; description: string; delay: number }) => (
  <motion.div 
    className={styles.featureCard}
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    viewport={{ once: true }}
    tabIndex={0}
    aria-label={title}
  >
    <i className={`fas ${icon}`} aria-hidden="true"></i>
    <h3>{title}</h3>
    <p>{description}</p>
  </motion.div>
);

const Gallery = () => (
  <motion.section 
    className={styles.gallery}
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    transition={{ duration: 0.8 }}
    viewport={{ once: true }}
    aria-labelledby="galeria-titulo"
  >
    <h2 id="galeria-titulo">Nuestras Instalaciones</h2>
    <div className={styles.gridGallery}>
      {[1,2,3,4].map((img, index) => (
        <motion.div 
          key={index} 
          className={styles.galleryItem}
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
          viewport={{ once: true }}
        >
          <img src={`/images/quincho-${img}.jpg`} alt={`Instalación ${img}`} loading="lazy" />
        </motion.div>
      ))}
    </div>
  </motion.section>
);

const Home = () => (
  <main className={styles.container}>
    <HeroSection />
    <section id="features" className={styles.features} aria-label="Características">
      {features.map((feature, index) => (
        <FeatureCard
          key={index}
          {...feature}
          delay={index * 0.2}
        />
      ))}
    </section>
    <Gallery />
  </main>
);

export default Home;