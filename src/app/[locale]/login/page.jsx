"use client";
import Footer from "../../../components/Footer/Footer";
import OrganizationAuthModal from "../../../components/OrganizationAuthModal/OrganizationAuthModal";
import * as React from "react";
import { useState, useEffect } from "react";
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useUser } from "../../../hooks/useUser";

export default function LoginPage() {
  const t = useTranslations('pages.login');
  const locale = useLocale();
  const router = useRouter();
  const { isLoggedIn, user, loading: userLoading } = useUser();
  const [orgModalOpen, setOrgModalOpen] = useState(false);

  useEffect(() => {
    if (!userLoading && isLoggedIn) {
      const role = user?.role;
      if (role === 'admin' || role === 'staph') {
        router.replace(`/${locale}/dashboard`);
      } else if (role === 'club') {
        router.replace(`/${locale}/club`);
      } else if (role === 'living_group') {
        router.replace(`/${locale}/living-group`);
      } else if (role === 'sports') {
        router.replace(`/${locale}/sports`);
      } else {
        router.replace(`/${locale}`);
      }
    }
  }, [userLoading, isLoggedIn, user, router, locale]);

  if (userLoading || isLoggedIn) {
    return null;
  }

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32">
        <section className="section container-narrow">
          <div className="text-center mb-8">
            <h1 className="mb-2">{t('title')}</h1>
            <p className="text-text-secondary">
              {t('description')}
            </p>
          </div>

          {/* Organization Login */}
          <div className="card-elevated flex flex-col items-center py-12">
            <button
              onClick={() => setOrgModalOpen(true)}
              className="px-8 py-3 text-sm uppercase tracking-wider font-medium text-white rounded transition-colors"
              style={{ backgroundColor: '#750014' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#5C0010'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#750014'}
            >
              {t('organizationLink')}
            </button>
          </div>

          {/* Organization Auth Modal */}
          <OrganizationAuthModal
            open={orgModalOpen}
            onClose={() => setOrgModalOpen(false)}
          />
        </section>
      </main>
      <Footer />
    </>
  );
}
