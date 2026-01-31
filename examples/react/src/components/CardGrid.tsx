import PolygonContainer from './PolygonContainer';
import styles from './CardGrid.module.css';

const cards = [
  {
    theme: 'ocean',
    title: 'Ocean Theme',
    description: 'Deep sea colors with cyan highlights',
  },
  {
    theme: 'sunset',
    title: 'Sunset Theme',
    description: 'Warm oranges and coral tones',
  },
  {
    theme: 'matrix',
    title: 'Matrix Theme',
    description: 'Digital green with dark backdrop',
  },
];

function CardGrid() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.heading}>Card Backgrounds</h2>
        <p className={styles.description}>
          Each card contains its own polygon background with a different theme.
        </p>
        <div className={styles.grid}>
          {cards.map((card) => (
            <PolygonContainer
              key={card.theme}
              theme={card.theme}
              options={{
                pointCount: 40,
                speed: 0.5,
              }}
              className={styles.card}
            >
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{card.title}</h3>
                <p className={styles.cardDescription}>{card.description}</p>
              </div>
            </PolygonContainer>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CardGrid;
