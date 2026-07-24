import {
  buildProductBreadcrumbJsonLd,
  buildProductJsonLd,
} from "@/lib/seo/product-jsonld";
import type { Product } from "@/lib/utils";

/** Product + Breadcrumb JSON-LD scripts for the PDP. */
export default function ProductJsonLd({ product }: { product: Product }) {
  const productLd = buildProductJsonLd(product);
  const breadcrumbLd = buildProductBreadcrumbJsonLd(product);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
    </>
  );
}
