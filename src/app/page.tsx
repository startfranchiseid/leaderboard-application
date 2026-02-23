"use client";

import { useEffect, useState, useMemo } from "react";
import "./page.css";
import { pb, getFileUrl } from "@/lib/pocketbase";
import {
  confettiBurst,
  confettiGrand,
  confettiRain,
} from "@/lib/confetti";
import type { Deal, LeaderboardEntry } from "@/lib/types";

function buildLeaderboard(allDeals: Deal[]): LeaderboardEntry[] {
  const mitraMap = new Map<string, LeaderboardEntry>();

  for (const deal of allDeals) {
    const key = deal.nama_mitra.trim().toLowerCase();
    if (!mitraMap.has(key)) {
      mitraMap.set(key, {
        nama_mitra: deal.nama_mitra,
        foto_mitra: deal.foto_mitra,
        foto_url: deal.foto_mitra
          ? getFileUrl(deal, deal.foto_mitra)
          : "",
        brand_name: deal.brand_name || "",
        brands_dealt: [],
        lokasi_buka_outlet: deal.lokasi_buka_outlet || "",
        total_transaksi: 0,
        deal_count: 0,
        latest_deal: deal.created,
        deals: [],
      });
    }
    const entry = mitraMap.get(key)!;
    entry.total_transaksi += deal.jumlah_transaksi;
    entry.deal_count += 1;
    entry.deals.push(deal);

    if (
      deal.brand_name &&
      !entry.brands_dealt.includes(deal.brand_name)
    ) {
      entry.brands_dealt.push(deal.brand_name);
    }

    if (deal.created > entry.latest_deal) {
      entry.latest_deal = deal.created;
      if (deal.brand_name) entry.brand_name = deal.brand_name;
      if (deal.foto_mitra) {
        entry.foto_mitra = deal.foto_mitra;
        entry.foto_url = getFileUrl(deal, deal.foto_mitra);
      }
      if (deal.lokasi_buka_outlet)
        entry.lokasi_buka_outlet = deal.lokasi_buka_outlet;
    }
  }

  return Array.from(mitraMap.values()).sort(
    (a, b) => b.total_transaksi - a.total_transaksi,
  );
}

function formatRupiah(num: number): string {
  return num.toLocaleString("id-ID");
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function LeaderboardPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [totalDeals, setTotalDeals] = useState(0);
  const [totalTransaksi, setTotalTransaksi] = useState(0);
  const [newDealHighlight, setNewDealHighlight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tickerItems, setTickerItems] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function fetchDeals() {
      try {
        const records = await pb
          .collection("deals")
          .getFullList<Deal>();

        // PB 0.23 workaround: sort manually since created field might not be indexed
        records.sort((a, b) => (b.created || "").localeCompare(a.created || ""));
        if (isMounted) {
          setDeals(records);
          setLeaderboard(buildLeaderboard(records));
          setTotalDeals(records.length);
          setTotalTransaksi(
            records.reduce((sum, d) => sum + d.jumlah_transaksi, 0)
          );
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch deals:", err);
        if (isMounted) setIsLoading(false);
      }
    }

    fetchDeals();

    // Subscribe to real-time events
    pb.collection("deals").subscribe<Deal>("*", (e) => {
      setDeals((prevDeals) => {
        let currentLeaderboard = buildLeaderboard(prevDeals);
        const previousTop = currentLeaderboard.length > 0 ? currentLeaderboard[0].nama_mitra : null;

        let updatedDeals = prevDeals;

        if (e.action === "create") {
          updatedDeals = [e.record, ...prevDeals];

          setNewDealHighlight(e.record.nama_mitra);
          setTimeout(() => {
            setNewDealHighlight(null);
          }, 3000);

          // Push to ticker
          const brand = e.record.brand_name ? ` (${e.record.brand_name})` : "";
          const amt = `Rp ${formatRupiah(e.record.jumlah_transaksi)}`;
          const msg = `🎉 ${e.record.nama_mitra}${brand} — ${amt}`;
          setTickerItems((prev) => [msg, ...prev].slice(0, 8));

          currentLeaderboard = buildLeaderboard(updatedDeals);
          const newTop = currentLeaderboard.length > 0 ? currentLeaderboard[0].nama_mitra : null;
          if (previousTop && newTop && previousTop !== newTop) {
            confettiGrand();
          } else {
            confettiBurst();
            setTimeout(() => confettiRain(), 300);
          }
        } else if (e.action === "update") {
          updatedDeals = prevDeals.map((d) => (d.id === e.record.id ? e.record : d));
        } else if (e.action === "delete") {
          updatedDeals = prevDeals.filter((d) => d.id !== e.record.id);
        }

        setLeaderboard(buildLeaderboard(updatedDeals));
        setTotalDeals(updatedDeals.length);
        setTotalTransaksi(
          updatedDeals.reduce((sum, d) => sum + d.jumlah_transaksi, 0)
        );
        return updatedDeals;
      });
    }).catch(err => {
      console.error("Failed to subscribe:", err);
    });

    return () => {
      isMounted = false;
      pb.collection("deals").unsubscribe("*");
    };
  }, []);

  const top3 = useMemo(() => leaderboard.slice(0, 3), [leaderboard]);
  const rest = useMemo(() => leaderboard.slice(3), [leaderboard]);

  return (
    <div className="leaderboard-app">
      <div className="ambient-bg">
        <div className="ambient-orb orb-1"></div>
        <div className="ambient-orb orb-2"></div>
        <div className="ambient-orb orb-3"></div>
      </div>

      <nav className="top-nav">
        <div className="nav-brand">
          <span className="brand-icon">🏆</span>
          <span className="brand-text">Expo Franchise</span>
        </div>
        <div className="nav-center">
          <span className="nav-link active">Leaderboard</span>
        </div>
        <div className="nav-right">
          <div className="live-indicator">
            <span className="live-dot"></span>
            LIVE
          </div>
        </div>
      </nav>

      <main className="main">
        {isLoading ? (
          <div className="center-state">
            <div className="spinner"></div>
            <p>Memuat leaderboard...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="center-state">
            <div className="empty-icon">🏁</div>
            <h2>Belum Ada Deal</h2>
            <p>Deal pertama akan segera muncul di sini!</p>
          </div>
        ) : (
          <>
            <section className="podium-section">
              <div className="podium-row">
                {/* 2nd Place */}
                {top3.length >= 2 ? (
                  <div
                    className={`podium-slot second ${newDealHighlight === top3[1].nama_mitra ? "highlight" : ""}`}
                  >
                    <div className="podium-avatar-wrap">
                      <div className="podium-avatar silver-ring">
                        {top3[1].foto_url ? (
                          <img src={top3[1].foto_url} alt={top3[1].nama_mitra} />
                        ) : (
                          <span className="initials">{getInitials(top3[1].nama_mitra)}</span>
                        )}
                      </div>
                    </div>
                    <h3 className="podium-name">{top3[1].nama_mitra}</h3>

                    <div className="podium-pedestal second-pedestal">
                      <div className="trophy-badge silver-trophy">🥈</div>
                      <div className="pedestal-brands">
                        {top3[1].brands_dealt.length > 0 ? (
                          top3[1].brands_dealt.map((b, idx) => (
                            <span key={idx} className="brand-badge">{b}</span>
                          ))
                        ) : (
                          <span className="pedestal-subtitle">Mitra</span>
                        )}
                      </div>
                      <div className="pedestal-amount">
                        <span className="heart-icon">💎</span>
                        <span className="amount-value">{formatRupiah(top3[1].total_transaksi)}</span>
                      </div>
                      <p className="pedestal-label">Transaksi</p>
                    </div>
                  </div>
                ) : (
                  <div className="podium-slot placeholder"></div>
                )}

                {/* 1st Place */}
                {top3.length >= 1 && (
                  <div
                    className={`podium-slot first ${newDealHighlight === top3[0].nama_mitra ? "highlight" : ""}`}
                  >
                    <div className="podium-avatar-wrap first-wrap">
                      <div className="crown-float">👑</div>
                      <div className="podium-avatar gold-ring first-avatar">
                        {top3[0].foto_url ? (
                          <img src={top3[0].foto_url} alt={top3[0].nama_mitra} />
                        ) : (
                          <span className="initials">{getInitials(top3[0].nama_mitra)}</span>
                        )}
                      </div>
                    </div>
                    <h3 className="podium-name first-name">{top3[0].nama_mitra}</h3>

                    <div className="podium-pedestal first-pedestal">
                      <div className="trophy-badge gold-trophy">🏆</div>
                      <div className="pedestal-brands">
                        {top3[0].brands_dealt.length > 0 ? (
                          top3[0].brands_dealt.map((b, idx) => (
                            <span key={idx} className="brand-badge">{b}</span>
                          ))
                        ) : (
                          <span className="pedestal-subtitle">Mitra</span>
                        )}
                      </div>
                      <div className="pedestal-amount first-amount">
                        <span className="heart-icon">💎</span>
                        <span className="amount-value">{formatRupiah(top3[0].total_transaksi)}</span>
                      </div>
                      <p className="pedestal-label">Transaksi</p>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {top3.length >= 3 ? (
                  <div
                    className={`podium-slot third ${newDealHighlight === top3[2].nama_mitra ? "highlight" : ""}`}
                  >
                    <div className="podium-avatar-wrap">
                      <div className="podium-avatar bronze-ring">
                        {top3[2].foto_url ? (
                          <img src={top3[2].foto_url} alt={top3[2].nama_mitra} />
                        ) : (
                          <span className="initials">{getInitials(top3[2].nama_mitra)}</span>
                        )}
                      </div>
                    </div>
                    <h3 className="podium-name">{top3[2].nama_mitra}</h3>

                    <div className="podium-pedestal third-pedestal">
                      <div className="trophy-badge bronze-trophy">🥉</div>
                      <div className="pedestal-brands">
                        {top3[2].brands_dealt.length > 0 ? (
                          top3[2].brands_dealt.map((b, idx) => (
                            <span key={idx} className="brand-badge">{b}</span>
                          ))
                        ) : (
                          <span className="pedestal-subtitle">Mitra</span>
                        )}
                      </div>
                      <div className="pedestal-amount">
                        <span className="heart-icon">💎</span>
                        <span className="amount-value">{formatRupiah(top3[2].total_transaksi)}</span>
                      </div>
                      <p className="pedestal-label">Transaksi</p>
                    </div>
                  </div>
                ) : (
                  <div className="podium-slot placeholder"></div>
                )}
              </div>
            </section>

            <div className="info-bar">
              <span>📊 Total <strong>{totalDeals}</strong> deals terdaftar</span>
              <span className="info-sep">•</span>
              <span>💰 Total transaksi: <strong>Rp {formatRupiah(totalTransaksi)}</strong></span>
              <span className="info-sep">•</span>
              <span>👥 <strong>{leaderboard.length}</strong> mitra</span>
            </div>

            {rest.length > 0 && (
              <section className="table-section">
                <div className="rank-table">
                  <div className="table-head">
                    <span className="th-rank">Rank</span>
                    <span className="th-name">Nama Mitra</span>
                    <span className="th-brand">Brand</span>
                    <span className="th-deals">Deals</span>
                    <span className="th-amount">Total Transaksi</span>
                  </div>
                  {rest.map((entry, i) => (
                    <div
                      key={entry.nama_mitra}
                      className={`table-row ${newDealHighlight === entry.nama_mitra ? "highlight" : ""}`}
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <span className="td-rank">
                        <span className="rank-num">{i + 4}</span>
                      </span>
                      <span className="td-name">
                        <div className="row-avatar">
                          {entry.foto_url ? (
                            <img src={entry.foto_url} alt={entry.nama_mitra} />
                          ) : (
                            <span className="row-initials">{getInitials(entry.nama_mitra)}</span>
                          )}
                        </div>
                        <div className="row-name-wrap">
                          <span className="row-name-text">{entry.nama_mitra}</span>
                          {entry.lokasi_buka_outlet && (
                            <span className="row-sub">📍 {entry.lokasi_buka_outlet}</span>
                          )}
                        </div>
                      </span>
                      <span className="td-brand">
                        {entry.brands_dealt.length > 0 ? (
                          <div className="table-brand-list">
                            {entry.brands_dealt.map((b, idx) => (
                              <span key={idx} className="brand-badge-sm">{b}</span>
                            ))}
                          </div>
                        ) : (
                          "-"
                        )}
                      </span>
                      <span className="td-deals">
                        <span className="deal-pill">{entry.deal_count}</span>
                      </span>
                      <span className="td-amount">
                        <span className="amt-icon">💎</span>
                        Rp {formatRupiah(entry.total_transaksi)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {tickerItems.length > 0 && (
        <div className="ticker-bar">
          <span className="ticker-label">🔴 LIVE</span>
          <div className="ticker-track">
            <div className="ticker-content">
              {[...tickerItems, ...tickerItems].map((item, i) => (
                <span key={i} className="ticker-item">{item}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
