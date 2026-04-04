import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import { activityService, Activity, ActivityFilterType } from "../services/activity.service";
import Button from "../components/ui/button/Button";

const filterOptions: { value: ActivityFilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Invoice", label: "Invoices" },
  { value: "Expense", label: "Expenses" },
  { value: "PurchaseOrder", label: "Orders" },
  { value: "CreditNote", label: "Credit Notes" },
  { value: "Client", label: "Clients" },
  { value: "Supplier", label: "Suppliers" },
  { value: "Product", label: "Products" },
  { value: "StockTake", label: "Stock" },
  { value: "Payment", label: "Payments" },
];

export default function ActivityLog() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<ActivityFilterType>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const initialLoad = useRef(true);

  const loadActivities = async (pageNum: number = 1, append: boolean = false) => {
    try {
      setLoading(true);
      setError("");
      const response = await activityService.getActivities(pageNum, 20, {
        entityType: activeFilter,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      
      if (append) {
        setActivities((prev) => [...prev, ...response.activities]);
      } else {
        setActivities(response.activities);
      }
      setHasMore(response.hasMore);
    } catch (err: any) {
      setError(err.message || "Failed to load activities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialLoad.current) {
      initialLoad.current = false;
      loadActivities(1, false);
    }
  }, []);

  useEffect(() => {
    if (!initialLoad.current) {
      setPage(1);
      loadActivities(1, false);
    }
  }, [activeFilter, dateFrom, dateTo]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadActivities(nextPage, true);
  };

  const clearFilters = () => {
    setActiveFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const groupedActivities = activityService.groupActivitiesByDate(activities);

  return (
    <>
      <PageMeta
        title="Activity Log | Financial Management System"
        description="Complete history of all business actions"
      />
      <PageBreadcrumb pageTitle="Activity Log" />

      <div className="p-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Activity Log
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Complete history of all business actions
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Filters */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] mb-6">
            <div className="flex flex-wrap items-end gap-4">
              {/* Entity Type Filters */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Filter by Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setActiveFilter(option.value)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        activeFilter === option.value
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="flex items-end gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    From
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    To
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                {(activeFilter !== "all" || dateFrom || dateTo) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="h-10"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            {loading && activities.length === 0 ? (
              <div className="space-y-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <span className="text-3xl">📋</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No activities found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {activeFilter !== "all" || dateFrom || dateTo
                    ? "Try adjusting your filters to see more results."
                    : "No activity yet. Start by creating your first invoice or adding a client."}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-8">
                  {groupedActivities.map((group) => (
                    <div key={group.date}>
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                        {group.date}
                      </h3>
                      <div className="space-y-4">
                        {group.items.map((activity) => (
                          <div
                            key={activity.id}
                            className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                          >
                            <div
                              className={`flex h-12 w-12 items-center justify-center rounded-full shrink-0 ${activityService.getEntityColor(
                                activity.entityType
                              )}`}
                            >
                              <span className="text-xl">{activity.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {activity.description}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  {activity.userEmail.split("@")[0]}
                                </span>
                                <span>·</span>
                                <span className="flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {new Date(activity.createdAt).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                  {activity.entityType}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => navigate(activity.link)}
                              className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shrink-0"
                            >
                              View
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load More */}
                {hasMore && (
                  <div className="mt-8 text-center">
                    <Button
                      onClick={handleLoadMore}
                      disabled={loading}
                      variant="outline"
                      className="min-w-[150px]"
                    >
                      {loading ? "Loading..." : "Load More"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Total Count */}
          {!loading && activities.length > 0 && (
            <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Showing {activities.length} activities
            </p>
          )}
        </div>
      </div>
    </>
  );
}
