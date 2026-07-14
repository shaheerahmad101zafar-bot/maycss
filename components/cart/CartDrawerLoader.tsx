"use client";

import dynamic from "next/dynamic";

// Lazy-load the drawer to keep it out of the initial layout bundle.
// SSR is disabled because the drawer reads localStorage on mount.
const CartDrawer = dynamic(() => import("./CartDrawer"), {
  ssr: false,
  loading: () => null,
});

export default function CartDrawerLoader() {
  return <CartDrawer />;
}
