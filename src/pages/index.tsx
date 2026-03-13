import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Head from '@docusaurus/Head';

import styles from './index.module.css';

function HeroSection() {
  return (
    <section className={styles.heroSection}>
      <div className={styles.heroBackground}></div>
      <div className={clsx(styles.heroBlur, styles.heroBlurTop)}></div>
      <div className={clsx(styles.heroBlur, styles.heroBlurBottom)}></div>

      <div className={styles.heroContent}>
        <div className={styles.versionBadge}>
          🚀 Now supporting Go and Rust
        </div>

        <Heading as="h1" className={styles.heroTitle}>
          Easy <span className={styles.highlight}>RMQ</span>
        </Heading>

        <p className={styles.heroDescription}>
          Modern AMQP libraries for Rust and Go with connection pool, publisher, and subscriber. Build reliable distributed systems with minimal boilerplate.
        </p>

        <div className={styles.heroButtons}>
          <Link
            className={styles.primaryBtn}
            to="/docs/intro">
            Get Started
          </Link>
          <Link
            className={styles.secondaryBtn}
            to="https://github.com/skyapps-id/easy-rmq-rs">
            View on GitHub
          </Link>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      title: 'Connection Pool',
      description: 'Efficiently manages AMQP connections using deadpool for optimal resource utilization and performance.',
      icon: '🔌'
    },
    {
      title: 'Auto Setup',
      description: 'Automatically creates exchanges, queues, and bindings - no manual infrastructure needed.',
      icon: '⚙️'
    },
    {
      title: 'Retry Mechanism',
      description: 'Automatic retry with configurable delays and dead letter queue for failed messages.',
      icon: '🔄'
    },
    {
      title: 'Distributed Tracing',
      description: 'Built-in trace ID generation with OpenTelemetry support for tracking message flows.',
      icon: '🔍'
    },
    {
      title: 'Worker Registry',
      description: 'Register and manage multiple workers with a clean, consistent pattern for message handling.',
      icon: '📋'
    },
    {
      title: 'Single Active Consumer',
      description: 'Ensure only one consumer processes messages at a time for strict ordering requirements.',
      icon: '🎯'
    },
    {
      title: 'Concurrency Control',
      description: 'Configurable worker concurrency with async/blocking spawn options for optimal throughput.',
      icon: '⚡'
    },
    {
      title: 'Middleware Support',
      description: 'Custom middleware for logging, metrics, distributed tracing, and more.',
      icon: '🔧'
    },
  ];

  return (
    <section className={styles.featuresSection}>
      <div className={styles.featuresHeader}>
        <h2 className={styles.featuresTitle}>Production-Ready Features</h2>
        <p className={styles.featuresDescription}>
          Everything you need to build reliable message-driven applications.
        </p>
      </div>

      <div className={styles.featuresGrid}>
        {features.map((feature, idx) => (
          <article key={idx} className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <span style={{ fontSize: '24px' }}>{feature.icon}</span>
            </div>
            <div className={styles.featureContent}>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureText}>{feature.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className={styles.ctaSection}>
      <div className={styles.ctaContainer}>
        <div className={clsx(styles.ctaBg, styles.ctaBgTopRight)}></div>
        <div className={clsx(styles.ctaBg, styles.ctaBgBottomLeft)}></div>

        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Ready to scale your messaging?</h2>
          <p className={styles.ctaDescription}>
            Join thousands of developers building resilient microservices with Easy RMQ.
          </p>
          <div className={styles.ctaButtons}>
            <Link
              className={styles.ctaPrimaryBtn}
              to="/docs/intro">
              Read the Docs
            </Link>
            <Link
              className={styles.ctaSecondaryBtn}
              to="/docs/examples">
              View Samples
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      description="Easy RMQ provides modern AMQP libraries for Rust and Go with connection pooling, publisher/subscriber patterns, and dependency injection. Build reliable distributed systems with minimal boilerplate code.">
      <Head>
        <title>Easy RMQ Modern AMQP Libraries for Rust & Go</title>
      </Head>
      <div className={styles.mainContainer}>
        <div className={styles.contentWrapper}>
          <HeroSection />
          <FeaturesSection />
          <CtaSection />
        </div>
      </div>
    </Layout>
  );
}
