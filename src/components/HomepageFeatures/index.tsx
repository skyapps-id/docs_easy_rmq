import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Simple & Intuitive API',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Clean publisher/subscriber patterns that make AMQP messaging straightforward. Auto-setup creates exchanges, queues, and bindings automatically.
      </>
    ),
  },
  {
    title: 'Dual Language Support',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        Available in both Rust and Go with identical features. Use the same concepts and patterns across your polyglot microservices.
      </>
    ),
  },
  {
    title: 'Production Ready',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        Built-in connection pooling, retry mechanisms, and DLQ support. Handle failures gracefully with configurable retry strategies.
      </>
    ),
  },
  {
    title: 'Advanced Features',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Single active consumer, distributed tracing with OpenTelemetry, middleware support, and dependency injection out of the box.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--6', styles.featureCard)}>
      <div className={styles.featureIconWrapper}>
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className={styles.featureContent}>
        <Heading as="h3" className={styles.featureTitle}>{title}</Heading>
        <p className={styles.featureDescription}>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
