import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import Plot from 'react-plotly.js';
import { FiDownload, FiRefreshCw } from 'react-icons/fi';
import XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import analyticsAnimation from './animation/Animation - 1749444335721.json';
import toast from 'react-hot-toast';
import { analyzeData } from '../lib/gemini';


ChartJS.register(...registerables);

export default function Visualize() {
    const location = useLocation();
    const fileId = location.state?.id;
    const token = location.state?.token;
    const navigate = useNavigate();
    const [analysisResult,setAnalysisResult]= useState("");

    

    const [chartData, setChartData] = useState(null);
    const [chartType, setChartType] = useState('bar');
    const [xAxis, setXAxis] = useState('');
    const [yAxis, setYAxis] = useState('');
    const [zAxis, setZAxis] = useState(''); // For 3D charts
    const [headers, setHeaders] = useState([]);
    const [data, setData] = useState([]);
    const [groupBy, setGroupBy] = useState('');
    const [aggregation, setAggregation] = useState('sum');
    const [chartTitle, setChartTitle] = useState('My Chart');
    const [exportFormat, setExportFormat] = useState('png');

    const chartRef = useRef(null);
    const plotlyRef = useRef(null);

    // Check if current chart type is 3D
    const is3DChart = ['bar3d', 'scatter3d', 'surface3d'].includes(chartType);

    // Calculate categories for 3D charts
    const categories = data && xAxis ? [...new Set(data.map(row => row[xAxis]))] : [];

    useEffect(() => {
        const getFile = async () => {
            try {
                const url = `https://sageexcelbackend-production.up.railway.app/api/auth/preview/${fileId}`;
                const response = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) throw new Error('File not found');
                const blob = await response.blob();
                const arrayBuffer = await blob.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

                if (jsonData.length > 0) {
                    const extractedHeaders = jsonData[0];
                    const previewRows = jsonData.slice(1).map(row => {
                        const obj = {};
                        extractedHeaders.forEach((header, i) => {
                            obj[header] = row[i];
                        });
                        return obj;
                    });
                    setHeaders(extractedHeaders);
                    setData(previewRows);
                    setChartData({ headers: extractedHeaders, data: previewRows });
                    setXAxis(extractedHeaders[0]);
                    setYAxis(extractedHeaders.length > 1 ? extractedHeaders[1] : extractedHeaders[0]);
                    setZAxis(extractedHeaders.length > 2 ? extractedHeaders[2] : extractedHeaders[0]);
                    setGroupBy(extractedHeaders[0]);
                }
            } catch (err) {
                console.error(err);
            }
        };
        getFile();
    }, [fileId, token]);

    const groupByAndAggregate = (groupCol, valueCol, operation = 'sum') => {
        const grouped = {};
        data.forEach(row => {
            const key = row[groupCol];
            const value = parseFloat(row[valueCol]) || 0;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(value);
        });
        return Object.entries(grouped).map(([key, values]) => ({
            label: key,
            value:
                operation === 'sum'
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

    const generateChartData = () => {
        if (!data || !xAxis) return { labels: [], datasets: [] };
        const finalData = groupBy && yAxis
            ? groupByAndAggregate(groupBy, yAxis, aggregation)
            : data.map(row => ({ label: row[xAxis], value: parseFloat(row[yAxis]) || 0 }));

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
        if (!data || !xAxis || !yAxis) return [];

        switch (chartType) {
            case 'bar3d':
                // Use aggregation for 3D bars when groupBy is enabled
                let processedData;
                if (groupBy && groupBy !== xAxis) {
                    // Group and aggregate data
                    processedData = groupByAndAggregate(groupBy, yAxis, aggregation);
                } else {
                    // Use raw data
                    processedData = data.map(row => ({
                        label: row[xAxis],
                        value: parseFloat(row[yAxis]) || 0
                    }));
                }

                const categories = [...new Set(processedData.map(item => item.label))];
                const barWidth = 0.8;
                const barDepth = 0.8;

                // Generate consistent colors - one color per unique category
                const baseColors = [
                    'rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)',
                    'rgba(199, 199, 199, 1)', 'rgba(83, 102, 255, 1)', 'rgba(255, 140, 184, 1)',
                    'rgba(100, 255, 218, 1)'
                ];

                // Create color mapping for categories
                const categoryColorMap = {};
                categories.forEach((category, index) => {
                    categoryColorMap[category] = baseColors[index % baseColors.length];
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
                        color: categoryColorMap[item.label], // Consistent color per category
                        name: item.label,
                        hovertext: hoverText,
                        hoverinfo: 'text',
                        showlegend: index === processedData.findIndex(d => d.label === item.label) // Show legend only once per category
                    };
                });

            case 'scatter3d':
                return [{
                    type: 'scatter3d',
                    mode: 'markers',
                    x: data.map(row => row[xAxis]),
                    y: data.map(row => parseFloat(row[yAxis]) || 0),
                    z: data.map(row => zAxis ? (parseFloat(row[zAxis]) || 0) : 0),
                    marker: {
                        size: 8,
                        color: data.map(row => parseFloat(row[yAxis]) || 0),
                        colorscale: 'Viridis',
                        opacity: 0.8,
                        colorbar: {
                            title: yAxis
                        }
                    },
                    text: data.map(row => `${xAxis}: ${row[xAxis]}<br>${yAxis}: ${row[yAxis]}<br>${zAxis}: ${row[zAxis]}`),
                    name: '3D Scatter'
                }];

            case 'surface3d':
                const uniqueX = [...new Set(data.map(row => row[xAxis]))];
                const uniqueY = [...new Set(data.map(row => parseFloat(row[yAxis]) || 0))];

                const zValues = uniqueY.map(y =>
                    uniqueX.map(x => {
                        const matchingRow = data.find(row => row[xAxis] === x && (parseFloat(row[yAxis]) || 0) === y);
                        return matchingRow ? (parseFloat(matchingRow[zAxis]) || 0) : 0;
                    })
                );

                return [{
                    type: 'surface',
                    x: uniqueX,
                    y: uniqueY,
                    z: zValues,
                    colorscale: 'Viridis',
                    name: '3D Surface'
                }];

            default:
                return [];
        }
    };

    const downloadChart = () => {
        const safeTitle = (chartTitle || chartType).replace(/[^a-z0-9]/gi, ' ').toLowerCase();

        if (is3DChart && plotlyRef.current) {
            // For Plotly 3D charts
            const plotlyDiv = plotlyRef.current.el;

            if (exportFormat === 'png') {
                window.Plotly.toImage(plotlyDiv, { format: 'png', width: 1200, height: 800 })
                    .then((dataUrl) => {
                        const link = document.createElement('a');
                        link.download = `${safeTitle}.png`;
                        link.href = dataUrl;
                        link.click();
                    });
            } else if (exportFormat === 'pdf') {
                window.Plotly.toImage(plotlyDiv, { format: 'png', width: 1200, height: 800 })
                    .then((dataUrl) => {
                        const pdf = new jsPDF();
                        const pageWidth = pdf.internal.pageSize.getWidth();
                        const imgProps = pdf.getImageProperties(dataUrl);
                        const ratio = imgProps.width / imgProps.height;
                        const pdfWidth = pageWidth * 0.9;
                        const pdfHeight = pdfWidth / ratio;
                        const x = (pageWidth - pdfWidth) / 2;
                        const y = 20;

                        pdf.text(chartTitle, x, 15);
                        pdf.addImage(dataUrl, 'PNG', x, y, pdfWidth, pdfHeight);
                        pdf.save(`${safeTitle}.pdf`);
                    });
            }
        } else {
            // For Chart.js 2D charts
            const chartInstance = chartRef.current;
            const canvas = chartInstance?.canvas;

            if (!canvas) {
                console.error('Canvas not found');
                return;
            }

            const imgData = canvas.toDataURL('image/png');

            if (exportFormat === 'png') {
                const link = document.createElement('a');
                link.download = `${safeTitle}.png`;
                link.href = imgData;
                link.click();
            } else if (exportFormat === 'pdf') {
                const pdf = new jsPDF();
                const pageWidth = pdf.internal.pageSize.getWidth();
                const imgProps = pdf.getImageProperties(imgData);
                const ratio = imgProps.width / imgProps.height;
                const pdfWidth = pageWidth * 0.9;
                const pdfHeight = pdfWidth / ratio;
                const x = (pageWidth - pdfWidth) / 2;
                const y = 20;

                pdf.text(chartTitle, x, 15);
                pdf.addImage(imgData, 'PNG', x, y, pdfWidth, pdfHeight);
                pdf.save(`${safeTitle}.pdf`);
            }
        }
    };

    const handleSaveAnalysis = async () => {
        const selectedFields = [xAxis, yAxis, zAxis, groupBy]; // Include groupBy explicitly

        const chartOptions = {
            title: chartTitle,
            aggregation,
            groupBy,
            xAxis,
            yAxis,
            zAxis,  // ✅ <-- include zAxis explicitly
            colorTheme: "default"
        };

        try {
            const response = await fetch("https://sageexcelbackend-production.up.railway.app/api/auth/saveAnalysis", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    chartTitle,
                    chartType,
                    selectedFields,
                    chartOptions,
                    fileId,
                    summary: analysisResult // <-- Save AI summary
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to save analysis");
            }

            toast.success("Analysis saved successfully!");
        } catch (err) {
            toast.error("Error saving analysis.");
        }
    };


    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: chartTitle,
                font: { size: 18, weight: 'bold' }
            },
            legend: { position: 'top' },
            tooltip: {
                callbacks: {
                    label: context => `${context.label}: ${context.raw}`
                }
            }
        }
    };

    const plotlyLayout = {
        title: {
            text: chartTitle,
            font: { size: 18 }
        },
        scene: {
            xaxis: {
                // Keep x-axis title consistent - it should always show what's actually on the x-axis
                title: xAxis,
                tickvals: categories.map((_, i) => i),
                ticktext: categories
            },
            yaxis: {
                // Show aggregation info in y-axis title when grouping is applied
                title: groupBy && groupBy !== xAxis ? `${yAxis} (${aggregation})` : yAxis
            },
            zaxis: { title: zAxis }
        },
        margin: { l: 0, r: 0, b: 0, t: 50 },
        showlegend: true
    };

    const handleReset = () => {
        setChartType('bar');
        setXAxis(headers[0]);
        setYAxis(headers.length > 1 ? headers[1] : headers[0]);
        setZAxis(headers.length > 2 ? headers[2] : headers[0]);
        setGroupBy(headers[0]);
        setAggregation('sum');
        setChartTitle('My Chart');
    };

    //ai addition
    const handleGeminiAnalysis = async()=> {
        const payload = {
            chartTitle,
            chartType,
            xAxis,
            yAxis,
            zAxis,
            groupBy,
            data,
            headers,
        }
        try{
            const result  = await analyzeData(payload);
            setAnalysisResult(result);
        } catch(err) {
            console.log(err)
            setAnalysisResult("AI analysis failed")
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-tr from-gray-100 via-indigo-100 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-10"
                >
                    <h1 className="text-5xl font-extrabold text-indigo-700 dark:text-indigo-300">📊 Data Canvas</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
                        Explore insights from your Excel files with interactive 2D & 3D visualizations.
                    </p>
                </motion.div>

                {!chartData ? (
                    <div className="flex justify-center">
                        <Lottie animationData={analyticsAnimation} className="h-96 w-96" />
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-6 items-stretch">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                            className="w-full lg:w-1/4 backdrop-blur-md bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 p-6 rounded-2xl shadow-lg overflow-y-auto max-h-[90vh]">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Configure Chart</h2>
                            <div className="space-y-4">
                                <label className="block text-sm text-gray-600 dark:text-gray-300 mt-2">Title</label>
                                <input value={chartTitle} onChange={e => setChartTitle(e.target.value)} placeholder="Chart Title"
                                    className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-700 border dark:border-gray-600 shadow-sm" />

                                <label className="block text-sm text-gray-600 dark:text-gray-300 mt-2">Chart Type</label>
                                <select value={chartType} onChange={e => setChartType(e.target.value)}
                                    className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-700 border dark:border-gray-600">
                                    <optgroup label="2D Charts">
                                        <option value="bar">📊 Bar</option>
                                        <option value="line">📈 Line</option>
                                        <option value="pie">🥧 Pie</option>
                                        <option value="doughnut">🍩 Doughnut</option>
                                        <option value="radar">📉 Radar</option>
                                        <option value="scatter">🔬 Scatter</option>
                                    </optgroup>
                                    <optgroup label="3D Charts">
                                        <option value="bar3d">🧊 3D Bar</option>
                                        <option value="scatter3d">🌐 3D Scatter</option>
                                        <option value="surface3d">🏔️ 3D Surface</option>
                                    </optgroup>
                                </select>

                                <label className="block text-sm text-gray-600 dark:text-gray-300 mt-2">Select X-Axis</label>
                                <select value={xAxis} onChange={e => setXAxis(e.target.value)}
                                    className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-700 border dark:border-gray-600">
                                    {headers.map((h, i) => <option key={i}>{h}</option>)}
                                </select>

                                {chartType !== 'pie' && (
                                    <>
                                        <label className="block text-sm text-gray-600 dark:text-gray-300 mt-2">Select Y-Axis</label>
                                        <select value={yAxis} onChange={e => setYAxis(e.target.value)}
                                            className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-700 border dark:border-gray-600">
                                            {headers.map((h, i) => <option key={i}>{h}</option>)}
                                        </select>

                                        {is3DChart && (
                                            <>
                                                <label className="block text-sm text-gray-600 dark:text-gray-300 mt-2">Select Z-Axis</label>
                                                <select value={zAxis} onChange={e => setZAxis(e.target.value)}
                                                    className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-700 border dark:border-gray-600">
                                                    {headers.map((h, i) => <option key={i}>{h}</option>)}
                                                </select>
                                            </>
                                        )}

                                        {/* Show Group-By and Aggregation for both 2D and 3D bar charts */}
                                        {(chartType === 'bar3d' || !is3DChart) && (
                                            <>
                                                <label className="block text-sm text-gray-600 dark:text-gray-300 mt-2">Group-By</label>
                                                <select value={groupBy} onChange={e => setGroupBy(e.target.value)}
                                                    className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-700 border dark:border-gray-600">
                                                    {headers.map((h, i) => <option key={i}>{h}</option>)}
                                                </select>
                                                <label className="block text-sm text-gray-600 dark:text-gray-300 mt-2">Aggregation Type</label>
                                                <select value={aggregation} onChange={e => setAggregation(e.target.value)}
                                                    className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-700 border dark:border-gray-600">
                                                    <option value="sum">Sum</option>
                                                    <option value="avg">Average</option>
                                                    <option value="count">Count</option>
                                                </select>
                                            </>
                                        )}
                                    </>
                                )}

                                <div className="flex space-x-2 items-center">
                                    <select
                                        value={exportFormat}
                                        onChange={(e) => setExportFormat(e.target.value)}
                                        className="px-3 py-2 rounded-md bg-white dark:bg-gray-700 border dark:border-gray-600 text-sm"
                                    >
                                        <option value="png">Export as PNG</option>
                                        <option value="pdf">Export as PDF</option>
                                    </select>
                                    <button
                                        onClick={downloadChart}
                                        className="bg-indigo-600 text-white rounded-lg py-2 px-4 hover:bg-indigo-700"
                                    >
                                        <FiDownload className="inline mr-1" /> Export
                                    </button>
                                </div>
                                <button
                                        onClick={handleGeminiAnalysis}
                                        className="w-full mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                >
                                        🤖 Analyze with Gemini
                                </button>
                                <button
                                    onClick={handleSaveAnalysis}
                                    className="w-full bg-green-600 text-white rounded-lg py-2 hover:bg-green-700 mt-2"
                                >
                                    💾 Save Analysis
                                </button>

                                <button onClick={handleReset} className="w-full bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg py-2 hover:bg-gray-400 mt-2">
                                    <FiRefreshCw className="inline mr-1" /> Reset
                                </button>
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                            className="w-full lg:w-3/4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg flex flex-col justify-between">
                            <motion.div
                                key={chartType}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5 }}
                                className="flex-1 min-h-[500px]"
                            >
                                {is3DChart ? (
                                    <Plot
                                        ref={plotlyRef}
                                        data={generate3DPlotlyData()}
                                        layout={plotlyLayout}
                                        config={{ responsive: true, displayModeBar: true }}
                                        style={{ width: '100%', height: '100%' }}
                                    />
                                ) : (
                                    <Chart ref={chartRef} type={chartType} data={generateChartData()} options={chartOptions} />
                                )}
                            </motion.div>
                            {analysisResult && (
                                <div className="mt-8 p-6 rounded-xl bg-indigo-100 dark:bg-indigo-900 text-gray-900 dark:text-white shadow">
                                    <h3 className="text-lg font-bold mb-2">AI Insight</h3>
                                    <pre className="whitespace-pre-wrap">{analysisResult}</pre>
                                </div>
                            )}
                        </motion.div>
                        
                    </div>
                )}
            </div>
        </div>
    );
}