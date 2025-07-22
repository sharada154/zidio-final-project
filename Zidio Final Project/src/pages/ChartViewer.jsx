import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Bar, Line, Pie, Doughnut, Radar, Scatter } from 'react-chartjs-2';
import Plot from 'react-plotly.js';
import 'chart.js/auto';
import { useSelector } from 'react-redux';
import { selectCurrentToken } from '../store/authSlice';
import * as XLSX from 'xlsx';

const ChartViewer = () => {
  const token = useSelector(selectCurrentToken);
  const { chartId } = useParams();
  const [chartData, setChartData] = useState(null);
  const [dataPoints, setDataPoints] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchChart = async () => {
      try {
        const response = await fetch(`https://sageexcelbackend-production.up.railway.app/api/auth/analysis/${chartId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
          setChartData(data);
          fetchFileAndExtractData(data.fileId, data.selectedFields);
        } else {
          setError(data.message || 'Failed to load chart');
        }
      } catch (err) {
        console.error(err);
        setError('Server error while loading chart');
      }
    };

    const fetchFileAndExtractData = async (fileId, selectedFields) => {
      try {
        const res = await fetch(`https://sageexcelbackend-production.up.railway.app/api/auth/preview/${fileId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const blob = await res.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet);

        const filtered = json.map(row => {
          const filteredRow = {};
          selectedFields.forEach(field => {
            filteredRow[field] = row[field];
          });
          return filteredRow;
        });
        setDataPoints(filtered);
      } catch (err) {
        console.error(err);
        setError('Failed to load file data');
      }
    };

    fetchChart();
  }, [token, chartId]);

  const groupByAndAggregate = (groupCol, valueCol, operation = 'sum') => {
    const grouped = {};
    dataPoints.forEach(row => {
      const key = row[groupCol];
      const value = parseFloat(row[valueCol]) || 0;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(value);
    });

    return Object.entries(grouped).map(([key, values]) => ({
      label: key,
      value: operation === 'sum'
        ? values.reduce((a, b) => a + b, 0)
        : operation === 'avg'
          ? values.reduce((a, b) => a + b, 0) / values.length
          : values.length,
    }));
  };

  const generateColors = (count) => {
    const baseColors = [
      'rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)',
      'rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)',
      'rgba(199, 199, 199, 0.6)', 'rgba(83, 102, 255, 0.6)', 'rgba(255, 140, 184, 0.6)',
      'rgba(100, 255, 218, 0.6)'
    ];
    const borderColors = baseColors.map(c => c.replace('0.6', '1'));
    return {
      backgroundColor: Array.from({ length: count }, (_, i) => baseColors[i % baseColors.length]),
      borderColor: Array.from({ length: count }, (_, i) => borderColors[i % borderColors.length])
    };
  };

  const generateChartConfig = () => {
    if (!chartData || !dataPoints.length) return null;

    const { selectedFields, chartOptions } = chartData;
    const xAxis = chartOptions?.xAxis || selectedFields[0];
    const yAxis = chartOptions?.yAxis || selectedFields[1];
    const groupBy = chartOptions?.groupBy || selectedFields[0];
    const aggregation = chartOptions?.aggregation || 'sum';

    const finalData = groupBy && yAxis
      ? groupByAndAggregate(groupBy, yAxis, aggregation)
      : dataPoints.map(row => ({ label: row[xAxis], value: parseFloat(row[yAxis]) || 0 }));

    const colors = generateColors(finalData.length);

    return {
      labels: finalData.map(d => d.label),
      datasets: [{
        label: `${yAxis} vs ${xAxis}`,
        data: finalData.map(d => d.value),
        backgroundColor: colors.backgroundColor,
        borderColor: colors.borderColor,
        borderWidth: 1
      }]
    };
  };

  const generate3DPlotlyData = () => {
    if (!chartData || !dataPoints.length) return [];

    const { selectedFields, chartOptions } = chartData;
    const xAxis = chartOptions?.xAxis || selectedFields[0];
    const yAxis = chartOptions?.yAxis || selectedFields[1];
    const zAxis = chartOptions?.zAxis || selectedFields[2] || null;
    const groupBy = chartOptions?.groupBy || selectedFields[0];
    const aggregation = chartOptions?.aggregation || 'sum';
    const data = dataPoints;
    const categories = [...new Set(data.map(row => row[xAxis]))];

    switch (chartData.chartType) {
      case 'bar3d':
        let processedData;
        if (groupBy && groupBy !== xAxis) {
          processedData = groupByAndAggregate(groupBy, yAxis, aggregation);
        } else {
          processedData = data.map(row => ({
            label: row[xAxis],
            value: parseFloat(row[yAxis]) || 0
          }));
        }

        const barWidth = 0.8;
        const barDepth = 0.8;
        const baseColors = [
          'rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)', 'rgba(83, 102, 255, 1)', 'rgba(255, 140, 184, 1)',
          'rgba(100, 255, 218, 1)'
        ];
        const categoryColorMap = {};
        categories.forEach((cat, idx) => {
          categoryColorMap[cat] = baseColors[idx % baseColors.length];
        });

        return processedData.map((item, index) => {
          const xCenter = categories.indexOf(item.label);
          const height = item.value;

          const x0 = xCenter - barWidth / 2;
          const x1 = xCenter + barWidth / 2;
          const y0 = 0;
          const y1 = height;
          const z0 = -barDepth / 2;
          const z1 = barDepth / 2;

          const vertices = {
            x: [x0, x1, x1, x0, x0, x1, x1, x0],
            y: [y0, y0, y1, y1, y0, y0, y1, y1],
            z: [z0, z0, z0, z0, z1, z1, z1, z1]
          };

          const faces = {
            i: [0, 0, 0, 1, 1, 2, 2, 3, 4, 4, 5, 6],
            j: [1, 3, 4, 2, 5, 3, 6, 0, 5, 7, 6, 7],
            k: [2, 1, 5, 3, 6, 2, 7, 4, 6, 6, 7, 3]
          };

          const hoverText = groupBy && groupBy !== xAxis
            ? `${groupBy}: ${item.label}<br>${yAxis} (${aggregation}): ${height.toFixed(2)}`
            : `${xAxis}: ${item.label}<br>${yAxis}: ${height}`;

          return {
            type: 'mesh3d',
            ...vertices,
            ...faces,
            opacity: 1,
            color: categoryColorMap[item.label],
            name: item.label,
            hovertext: hoverText,
            hoverinfo: 'text',
            showlegend: index === processedData.findIndex(d => d.label === item.label)
          };
        });

      case 'scatter3d':
        const xValues = data.map(row => isNaN(row[xAxis]) ? row[xAxis] : parseFloat(row[xAxis]));
        const yValues = data.map(row => parseFloat(row[yAxis]) || 0);
        const zValues = data.map(row => {
          const val = zAxis ? row[zAxis] : null;
          const num = val && typeof val === 'string'
            ? parseFloat(val.replace(/[^0-9.]/g, ''))
            : parseFloat(val);
          return !isNaN(num) ? num : 0;
        });

        return [{
          type: 'scatter3d',
          mode: 'markers',
          x: xValues,
          y: yValues,
          z: zValues,
          marker: {
            size: 8,
            color: yValues,
            colorscale: 'Viridis',
            opacity: 0.8,
            colorbar: {
              title: yAxis
            }
          },
          text: data.map(row =>
            zAxis
              ? `${xAxis}: ${row[xAxis]}<br>${yAxis}: ${row[yAxis]}<br>${zAxis}: ${row[zAxis]}`
              : `${xAxis}: ${row[xAxis]}<br>${yAxis}: ${row[yAxis]}`
          ),
          hoverinfo: 'text',
          name: '3D Scatter'
        }];

      case 'surface3d':
        const uniqueX = [...new Set(data.map(row => row[xAxis]))];
        const uniqueY = [...new Set(data.map(row => parseFloat(row[yAxis]) || 0))];

        const zMatrix = uniqueY.map(y =>
          uniqueX.map(x => {
            const match = data.find(row =>
              row[xAxis] === x && (parseFloat(row[yAxis]) || 0) === y
            );
            return match ? (parseFloat(match[zAxis]) || 0) : 0;
          })
        );

        return [{
          type: 'surface',
          x: uniqueX,
          y: uniqueY,
          z: zMatrix,
          colorscale: 'Viridis',
          name: '3D Surface'
        }];

      default:
        return [];
    }
  };

  if (error) return <div className="text-red-600 text-center mt-10">{error}</div>;
  if (!chartData || dataPoints.length === 0) return <div className="text-center mt-10">Loading chart...</div>;

  const { chartType, chartOptions, selectedFields } = chartData;
  const is3DChart = ['bar3d', 'scatter3d', 'surface3d'].includes(chartType);
  const ChartComponent = {
    bar: Bar, line: Line, pie: Pie, doughnut: Doughnut, radar: Radar, scatter: Scatter
  }[chartType] || Bar;

  const xAxis = chartOptions?.xAxis || selectedFields[0];
  const yAxis = chartOptions?.yAxis || selectedFields[1];
  const zAxis = selectedFields[2] || null;
  const groupBy = chartOptions?.groupBy || selectedFields[0];
  const aggregation = chartOptions?.aggregation || 'sum';

  const categories = [...new Set(dataPoints.map(row => row[xAxis]))];

  const plotlyLayout = {
    title: {
      text: chartOptions?.title || chartData.title,
      font: { size: 18 }
    },
    scene: {
      xaxis: {
        title: xAxis,
        tickvals: categories.map((_, i) => i),
        ticktext: categories
      },
      yaxis: {
        title: groupBy && groupBy !== xAxis ? `${yAxis} (${aggregation})` : yAxis
      },
      zaxis: {
        title: zAxis || 'Z'
      }
    },
    margin: { l: 0, r: 0, b: 0, t: 50 },
    showlegend: chartType !== 'scatter3d'
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-indigo-700 dark:text-white mb-6">
          📊 {chartOptions?.title || chartData.title || 'Saved Chart'}
        </h1>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="h-[600px]">
            {is3DChart ? (
              <Plot
                data={generate3DPlotlyData()}
                layout={plotlyLayout}
                config={{ responsive: true, displayModeBar: true }}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <ChartComponent
                data={generateChartConfig()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    title: {
                      display: true,
                      text: chartOptions?.title || chartData.title,
                      font: { size: 18 }
                    },
                    legend: { position: 'top' },
                    tooltip: {
                      callbacks: {
                        label: context => `${context.label}: ${context.raw}`
                      }
                    }
                  }
                }}
              />
            )}
          </div>
        </div>
        {/* AI Summary Section */}
        {chartData?.summary && (
          <div className="mt-8 p-6 rounded-xl bg-indigo-100 dark:bg-indigo-900 text-gray-900 dark:text-white shadow mx-auto max-w-3xl">
            <h3 className="text-lg font-bold mb-2 text-center">AI Insight</h3>
            {Array.isArray(chartData.summary) ? (
              <ul className="list-disc list-inside space-y-2">
                {chartData.summary.map((line, idx) => (
                  <li key={idx} className="text-base text-left whitespace-pre-line">{line}</li>
                ))}
              </ul>
            ) : (
              <pre className="whitespace-pre-line text-base text-left">{chartData.summary}</pre>
            )}
          </div>
        )}
        {/* End AI Summary Section */}
        <div className="text-center mt-6">
          <button
            onClick={() => window.history.back()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition"
          >
            ← Back to Charts
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChartViewer;
