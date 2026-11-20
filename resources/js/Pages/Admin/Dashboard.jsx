import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    CheckCircle2,
    Search,
    Sparkles,
    UserRoundPlus,
    Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
});

function formatDate(value) {
    if (!value) {
        return 'No expiry';
    }

    return dateFormatter.format(new Date(`${value}T00:00:00`));
}

function SubscriptionForm({ customer }) {
    const { data, setData, patch, processing, errors, recentlySuccessful } =
        useForm({
            is_subscribed: customer.is_subscribed,
            subscription_expires_at:
                customer.subscription_expires_at ?? '',
        });

    const submit = (event) => {
        event.preventDefault();

        patch(
            route('admin.customers.subscription.update', customer.id),
            { preserveScroll: true },
        );
    };

    return (
        <form onSubmit={submit} className="grid gap-3 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Status
                <select
                    value={data.is_subscribed ? 'active' : 'inactive'}
                    onChange={(event) =>
                        setData((current) => ({
                            ...current,
                            is_subscribed: event.target.value === 'active',
                            subscription_expires_at:
                                event.target.value === 'active'
                                    ? current.subscription_expires_at
                                    : '',
                        }))
                    }
                    className="rounded-xl border-slate-200 bg-white text-sm shadow-sm focus:border-amber-500 focus:ring-amber-500"
                >
                    <option value="active">Premium</option>
                    <option value="inactive">Free</option>
                </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Expiry date
                <input
                    type="date"
                    value={data.subscription_expires_at}
                    disabled={!data.is_subscribed}
                    onChange={(event) =>
                        setData('subscription_expires_at', event.target.value)
                    }
                    className="rounded-xl border-slate-200 text-sm shadow-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 focus:border-amber-500 focus:ring-amber-500"
                />
            </label>

            <button
                type="submit"
                disabled={processing}
                className="inline-flex h-[42px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-wait disabled:opacity-60"
            >
                {recentlySuccessful && <CheckCircle2 className="h-4 w-4" />}
                {processing ? 'Saving...' : 'Save'}
            </button>

            {errors.subscription_expires_at && (
                <p className="text-sm text-rose-600 lg:col-span-3">
                    {errors.subscription_expires_at}
                </p>
            )}
        </form>
    );
}

function StatCard({ icon: Icon, label, value, accent }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
                </div>
                <span className={`rounded-2xl p-3 ${accent}`}>
                    <Icon className="h-6 w-6" />
                </span>
            </div>
        </div>
    );
}

export default function Dashboard({ customers, filters, stats }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters.search);

    useEffect(() => {
        setSearch(filters.search);
    }, [filters.search]);

    const applyFilters = (event) => {
        event.preventDefault();

        router.get(
            route('admin.dashboard'),
            { search, subscription: filters.subscription },
            { preserveState: true, replace: true },
        );
    };

    const changeSubscriptionFilter = (subscription) => {
        router.get(
            route('admin.dashboard'),
            { search, subscription },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Admin Dashboard" />

            <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
                <div className="border-b border-slate-200 bg-slate-950 text-white">
                    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
                                <Sparkles className="h-3.5 w-3.5" />
                                Administration
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                Customer subscriptions
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
                                Find customer accounts and control their premium access from one place.
                            </p>
                        </div>
                    </div>
                </div>

                <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                            <CheckCircle2 className="h-5 w-5 shrink-0" />
                            {flash.success}
                        </div>
                    )}

                    <section className="grid gap-4 md:grid-cols-3">
                        <StatCard
                            icon={Users}
                            label="Total customers"
                            value={stats.customers}
                            accent="bg-sky-100 text-sky-700"
                        />
                        <StatCard
                            icon={Sparkles}
                            label="Active subscriptions"
                            value={stats.active_subscriptions}
                            accent="bg-amber-100 text-amber-700"
                        />
                        <StatCard
                            icon={UserRoundPlus}
                            label="New this month"
                            value={stats.new_this_month}
                            accent="bg-emerald-100 text-emerald-700"
                        />
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-950">Customers</h2>
                                <p className="text-sm text-slate-500">
                                    {customers.total} matching account{customers.total === 1 ? '' : 's'}
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <form onSubmit={applyFilters} className="relative min-w-0 sm:w-72">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="search"
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Search name or email"
                                        className="w-full rounded-xl border-slate-200 py-2.5 pl-10 pr-3 text-sm shadow-sm focus:border-amber-500 focus:ring-amber-500"
                                    />
                                </form>

                                <select
                                    value={filters.subscription}
                                    onChange={(event) =>
                                        changeSubscriptionFilter(event.target.value)
                                    }
                                    className="rounded-xl border-slate-200 text-sm shadow-sm focus:border-amber-500 focus:ring-amber-500"
                                >
                                    <option value="all">All subscriptions</option>
                                    <option value="active">Premium only</option>
                                    <option value="inactive">Free / expired</option>
                                </select>
                            </div>
                        </div>

                        <div className="divide-y divide-slate-200">
                            {customers.data.length === 0 ? (
                                <div className="px-5 py-16 text-center">
                                    <Users className="mx-auto h-10 w-10 text-slate-300" />
                                    <h3 className="mt-4 font-semibold text-slate-900">No customers found</h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Adjust the search or subscription filter and try again.
                                    </p>
                                </div>
                            ) : (
                                customers.data.map((customer) => (
                                    <article key={customer.id} className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)] xl:items-center">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="truncate font-bold text-slate-950">
                                                    {customer.name}
                                                </h3>
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                        customer.has_active_subscription
                                                            ? 'bg-amber-100 text-amber-800'
                                                            : 'bg-slate-100 text-slate-600'
                                                    }`}
                                                >
                                                    {customer.has_active_subscription ? 'Premium' : 'Free'}
                                                </span>
                                            </div>
                                            <p className="mt-1 truncate text-sm text-slate-600">
                                                {customer.email}
                                            </p>
                                            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <CalendarDays className="h-3.5 w-3.5" />
                                                    Joined {formatDate(customer.created_at)}
                                                </span>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Sparkles className="h-3.5 w-3.5" />
                                                    {customer.is_subscribed
                                                        ? `Expires ${formatDate(customer.subscription_expires_at)}`
                                                        : 'Subscription disabled'}
                                                </span>
                                            </div>
                                        </div>

                                        <SubscriptionForm customer={customer} />
                                    </article>
                                ))
                            )}
                        </div>

                        {customers.links.length > 3 && (
                            <nav className="flex flex-wrap items-center justify-center gap-2 border-t border-slate-200 px-5 py-4">
                                {customers.links.map((link, index) => (
                                    <Link
                                        key={`${link.label}-${index}`}
                                        href={link.url ?? '#'}
                                        preserveScroll
                                        className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                                            link.active
                                                ? 'bg-slate-900 text-white'
                                                : link.url
                                                  ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                                                  : 'pointer-events-none text-slate-300'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </nav>
                        )}
                    </section>
                </main>
            </div>
        </AuthenticatedLayout>
    );
}
