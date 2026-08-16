import React, { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { EmptyState } from "../components/ui";
import { PROGRAMME_ORDER } from "../lib/constants";

const COLORS_LIST = ["#2C4A73", "#A23B2E", "#3D6B4F", "#A9781F", "#5A7CA8", "#C97A6D"];

export default function AnalysisPage({ courses }) {
  const data = useMemo(() => {
    const byType = {};
    const byProgramme = {};
    const byCategory = {};
    let cie1Count = 0, cie3Count = 0;

    courses.forEach((course) => {
      (course.cie1 || []).forEach((o) => {
        if (!o.method) return;
        byType[o.method] = (byType[o.method] || 0) + 1;
        byProgramme[course.programme] = (byProgramme[course.programme] || 0) + 1;
        byCategory[course.category] = (byCategory[course.category] || 0) + 1;
        cie1Count += 1;
      });
      (course.cie3 || []).forEach((o) => {
        if (!o.method) return;
        byType[o.method] = (byType[o.method] || 0) + 1;
        byProgramme[course.programme] = (byProgramme[course.programme] || 0) + 1;
        byCategory[course.category] = (byCategory[course.category] || 0) + 1;
        cie3Count += 1;
      });
    });

    const typeData = Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
    const progData = PROGRAMME_ORDER.filter((p) => byProgramme[p]).map((p) => ({ name: p, count: byProgramme[p] }));
    const catData = Object.entries(byCategory).map(([name, value]) => ({ name, value }));
    const stageData = [{ name: "CIE-1", value: cie1Count }, { name: "CIE-3", value: cie3Count }];
    return { typeData, progData, catData, stageData, total: cie1Count + cie3Count };
  }, [courses]);

  if (data.total === 0) {
    return (
      <div className="px-6 sm:px-8 py-6">
        <EmptyState
          icon={PieChartIcon}
          title="No CIE components mapped yet"
          body="Once course leads map evaluation methods for CIE-1 / CIE-3 in 'Courses I Lead', this analysis fills in automatically."
        />
      </div>
    );
  }

  return (
    <div className="px-6 sm:px-8 py-6 flex flex-col gap-4 overflow-y-auto">
      <div className="rounded-sm p-4 bg-white border border-line">
        <h3 className="text-sm font-semibold uppercase mb-3 text-ink2" style={{ letterSpacing: "0.06em" }}>
          Evaluation methods in use (CIE-1 + CIE-3)
        </h3>
        <div style={{ height: Math.max(220, data.typeData.length * 26) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.typeData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid stroke="#EAE5D5" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#6B6355" }} />
              <YAxis type="category" dataKey="name" width={190} tick={{ fontSize: 11, fill: "#6B6355" }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4 }} />
              <Bar dataKey="count" fill="#2C4A73" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-sm p-4 bg-white border border-line">
          <h3 className="text-sm font-semibold uppercase mb-3 text-ink2" style={{ letterSpacing: "0.06em" }}>By programme</h3>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.progData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#EAE5D5" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6B6355" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#6B6355" }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4 }} />
                <Bar dataKey="count" fill="#3D6B4F" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-sm p-4 bg-white border border-line">
          <h3 className="text-sm font-semibold uppercase mb-3 text-ink2" style={{ letterSpacing: "0.06em" }}>By category</h3>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.catData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={2}>
                  {data.catData.map((_, i) => <Cell key={i} fill={COLORS_LIST[i % COLORS_LIST.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-sm p-4 bg-white border border-line">
          <h3 className="text-sm font-semibold uppercase mb-3 text-ink2" style={{ letterSpacing: "0.06em" }}>CIE-1 vs CIE-3</h3>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.stageData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={2}>
                  <Cell fill="#2C4A73" />
                  <Cell fill="#A23B2E" />
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
