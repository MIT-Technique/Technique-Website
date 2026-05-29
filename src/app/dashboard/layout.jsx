"use client";

import { Suspense, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";

function DashboardLayoutInner({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { isLoggedIn, user, loading } = useUser();

  useEffect(() => {
    if (
      !loading &&
      (!isLoggedIn || (user?.role !== "admin" && user?.role !== "staph"))
    ) {
      router.push(`/login`);
    }

    // Redirect staph users from overview to first available tab

    if (
      !loading &&
      isLoggedIn &&
      user?.role === "staph" &&
      pathname === `/dashboard`
    ) {
      const hasAccess = user?.access?.length > 0;
      if (hasAccess) {
        router.replace(`/dashboard/photoshoots`);
      }
    }
  }, [isLoggedIn, user, loading, router, pathname]);

  if (loading) {
    return (
      <main className="min-h-screen pt-24 lg:pt-32">
        <div className="container-text text-center">
          <p className="text-text-secondary">Loading...</p>
        </div>
      </main>
    );
  }

  if (!isLoggedIn || (user?.role !== "admin" && user?.role !== "staph")) {
    return null;
  }

  const isAdmin = user?.role === "admin";

  const ACCESS_TO_TAB = {
    clubs: {
      id: "resp-clubs",
      label: "Clubs",
      href: `/dashboard/responses/clubs`,
    },
    living_groups: {
      id: "resp-living-groups",
      label: "Living Groups",
      href: `/dashboard/responses/living-groups`,
    },
    sports: {
      id: "resp-sports",
      label: "Sports",
      href: `/dashboard/responses/sports`,
    },
    seniors: {
      id: "resp-seniors",
      label: "Seniors",
      href: `/dashboard/responses/seniors`,
    },
  };

  const allResponsesSubTabs = Object.values(ACCESS_TO_TAB);
  const responsesSubTabs = isAdmin
    ? allResponsesSubTabs
    : allResponsesSubTabs.filter((tab) => {
        const entry = Object.entries(ACCESS_TO_TAB).find(
          ([, v]) => v.id === tab.id,
        );
        return entry && user?.access?.includes(entry[0]);
      });

  const settingsSubTabs = [
    { id: "users", label: "Users", href: `/dashboard/users` },
    { id: "logs", label: "Logs", href: `/dashboard/logs` },
    { id: "forms", label: "Forms", href: `/dashboard/settings` },
    {
      id: "yearbook-inventory",
      label: "Yearbook Inventory",
      href: `/dashboard/settings/yearbook-inventory`,
    },
    { id: "reset", label: "Reset", href: `/dashboard/settings/reset` },
  ];

  const staphSettingsSubTabs = [
    { id: "users", label: "Users", href: `/dashboard/users` },
  ];

  const inquiriesSubTabs = [
    {
      id: "inq-hire-requests",
      label: "Hire Requests",
      href: `/dashboard/inquiries/hire-requests`,
    },
    {
      id: "inq-yearbook-requests",
      label: "Yearbook Requests",
      href: `/dashboard/inquiries/yearbook-requests`,
    },
  ];

  const USER_TYPE_FILTER_TAB = {
    all: "All",
    individual: "Individual",
    orgs: "Orgs",
  };

  const isResponsesPage =
    responsesSubTabs.some((tab) => pathname === tab.href) ||
    pathname === `/dashboard/responses`;
  const isSettingsPage = settingsSubTabs.some((tab) => pathname === tab.href);
  const isInquiriesPage = inquiriesSubTabs.some((tab) => pathname === tab.href);
  const isUsersPage = pathname === `/dashboard/users`;
  const userTypeFilter = searchParams.get("type") || "all";

  const allTabs = [
    { id: "overview", label: "Overview", href: `/dashboard`, adminOnly: true },
    {
      id: "photoshoots",
      label: "Photoshoots",
      href: `/dashboard/photoshoots`,
      adminOnly: false,
    },
    {
      id: "responses",
      label: "Responses",
      href: responsesSubTabs[0]?.href || `/dashboard/responses/clubs`,
      adminOnly: false,
      requiresAccess: true,
    },
    {
      id: "inquiries",
      label: "Inquiries",
      href: `/dashboard/inquiries/hire-requests`,
      adminOnly: false,
    },
    {
      id: "settings",
      label: "Settings",
      href: `/dashboard/users`,
      adminOnly: false,
    },
  ];

  const tabs = isAdmin
    ? allTabs
    : allTabs.filter((tab) => {
        if (tab.adminOnly) return false;
        if (tab.requiresAccess) return responsesSubTabs.length > 0;
        return true;
      });

  return (
    <main className="min-h-screen pt-24 lg:pt-32 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-medium mb-2">
            {isAdmin ? "Admin Dashboard" : "Staph Dashboard"}
          </h1>
          <p className="text-text-secondary text-sm">
            {`Welcome, ${user?.name || user?.email}`}
          </p>
        </div>

        {isAdmin || user?.access?.length > 0 ? (
          <>
            {/* Tabs */}
            <div className="border-b border-border mb-8">
              <nav className="flex gap-8 overflow-x-auto">
                {tabs.map((tab) => {
                  const isActive =
                    tab.id === "responses"
                      ? isResponsesPage
                      : tab.id === "settings"
                        ? isSettingsPage
                        : tab.id === "inquiries"
                          ? isInquiriesPage
                          : pathname === tab.href;
                  return (
                    <Link
                      key={tab.id}
                      href={tab.href}
                      className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        isActive
                          ? "border-accent text-accent"
                          : "border-transparent text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {tab.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Sub-tabs */}
            {(isResponsesPage || isSettingsPage || isInquiriesPage) && (
              <div className="flex items-center gap-4 mb-6 overflow-x-auto">
                {(isResponsesPage
                  ? responsesSubTabs
                  : isInquiriesPage
                    ? inquiriesSubTabs
                    : isAdmin
                      ? settingsSubTabs
                      : staphSettingsSubTabs
                ).map((tab) => (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      pathname === tab.href
                        ? "bg-accent text-white"
                        : "bg-bg-secondary text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {tab.label}
                  </Link>
                ))}
                {isUsersPage && (
                  <>
                    <span className="border-l border-border h-4" />
                    {["all", "individual", "orgs"].map((key) => (
                      <Link
                        key={key}
                        href={
                          key === "all"
                            ? `/dashboard/users`
                            : `/dashboard/users?type=${key}`
                        }
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          userTypeFilter === key
                            ? "bg-accent text-white"
                            : "bg-bg-secondary text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        {USER_TYPE_FILTER_TAB[key]}
                      </Link>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Content */}
            {children}
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-text-secondary">
              {
                "You don't have any permissions set. Please contact an admin for additional access."
              }
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen pt-24 lg:pt-32">
          <div className="container-text text-center">
            <p className="text-text-secondary">Loading...</p>
          </div>
        </main>
      }
    >
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </Suspense>
  );
}
