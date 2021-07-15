import React from "react";
import clsx from "clsx";
import styles from "./HomepageFeatures.module.css";

const FeatureList = [
  {
    title: "Hasura",
    Svg: require("../../static/img/programming.svg").default,
    description: (
      <>
        Works alongside with Hasura GraphQL Engine and seamlessly integrates the
        recurrent features you're craving for.
      </>
    ),
  },
  {
    title: "Authentication",
    Svg: require("../../static/img/authentication.svg").default,
    description: (
      <>
        Comprehensive user accounts management, JWT, optional multi-factor
        authentication, Hasura claims with roles and custom fields and many
        more.
      </>
    ),
  },
  {
    title: "Storage",
    Svg: require("../../static/img/storage.svg").default,
    description: (
      <>
        Easy and configurable API for any S3-compatible object storage such as
        Minio.
      </>
    ),
  },
];

function Feature({ Svg, title, description }) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <Svg className={styles.featureSvg} alt={title} />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
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
