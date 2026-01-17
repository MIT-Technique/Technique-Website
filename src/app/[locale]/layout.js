import { Inter, Raleway } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, localeDirection } from '../../i18n/config';
import "../globals.css";
import Navbar from "../../components/Navbar_and_Sidebar/Navbar_new";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const inter = Inter({ subsets: ["latin"] });
const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
});

export async function generateMetadata({ params: { locale } }) {
  const messages = await getMessages({ locale });

  return {
    title: messages.common?.siteTitle || "MIT Technique",
    description: messages.common?.siteDescription || "Memorializing MIT since 1885",
  };
}

export default async function RootLayout({ children, params: { locale } }) {
  // Validate locale
  if (!locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages({ locale });
  const direction = localeDirection[locale] || 'ltr';

  return (
    <html lang={locale} dir={direction}>
      <body className={`${inter.className} ${raleway.variable} bg-[#FFFAFA] overflow-y-auto scroll-smooth relative`}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Navbar />
          <div className="min-h-screen">
            {children}
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

// Generate static params for all locales
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
