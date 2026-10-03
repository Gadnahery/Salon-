import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { SalonBoot } from "@/lib/salon/boot";
import { MotionProvider } from "@/components/motion-provider";
import appCss from "../styles.css?url";

const APP_NAME = "Warembo Village";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      {
        name: "description",
        content:
          "Warembo Village — More than Beauty... It's a lifestyle. Book Hair Clinic, Hair Salon, Makeup Studio and Nails Spa in Dar es Salaam.",
      },
      { name: "theme-color", content: "#F7F6F3" },
      {
        name: "keywords",
        content:
          "salon Dar es Salaam, beauty salon Madale, hair braiding Tanzania, nail spa Dar, makeup studio Mivumoni, Warembo Village, book salon appointment Tanzania, hair clinic Dar es Salaam",
      },
      { name: "geo.region", content: "TZ-02" },
      { name: "geo.placename", content: "Dar es Salaam" },
      
      { property: "og:title", content: APP_NAME },
      { property: "og:description", content: "More than Beauty... It's a lifestyle." },
      { property: "og:image", content: "/og.jpg" },
      { name: "apple-mobile-web-app-title", content: "Warembo Village" },
    ],
    links: [
      { rel: "icon", href: "/favicon.ico" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
      { rel: "icon", type: "image/png", sizes: "48x48", href: "/favicon-48.png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;0,6..96,600;0,6..96,700;1,6..96,400&family=Jost:ital,wght@0,400;0,500;0,600;1,400&family=Pinyon+Script&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "canonical", href: "https://wsalon-six.vercel.app/" },
      { rel: "sitemap", type: "application/xml", href: "/sitemap.xml" },
    ],
  }),
  component: () => (
    <html lang="en" className="antialiased" data-theme="ivory" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-bg text-ink">
        <PreviewHostBridge />
        <AuthProvider>
          <MotionProvider>
            <SalonBoot />
            <Outlet />
          </MotionProvider>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
