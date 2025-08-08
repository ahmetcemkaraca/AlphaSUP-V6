import { Helmet } from "react-helmet-async";

type SEOProps = {
  title: string;
  description?: string;
  canonical?: string;
};

export function SEO({ title, description, canonical }: SEOProps) {
  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {canonical && <link rel="canonical" href={canonical} />}
    </Helmet>
  );
}
