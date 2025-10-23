import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const ChartTab = ({ transactions, categories }) => {
    
    const chartData = useMemo(() => {
        if (!transactions || !categories || transactions.length === 0 || categories.length === 0) {
            return null;
        }

        const spending = {};
        categories.forEach((category, index) => {
            const amountStr = transactions[index].amount.replace(/[^0-9.-]+/g,"");
            const amount = parseFloat(amountStr);
            if (!isNaN(amount) && amount > 0) { // Only include debits/purchases
                spending[category] = (spending[category] || 0) + amount;
            }
        });

        if (Object.keys(spending).length === 0) return null;

        return {
            labels: Object.keys(spending),
            datasets: [{
                label: 'Spending',
                data: Object.values(spending),
                backgroundColor: ['#4f46e5', '#38bdf8', '#34d399', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
            }]
        };
    }, [transactions, categories]);

    return (
        <div className="py-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Spending Breakdown</h2>
            <div className="max-w-md mx-auto">
                {chartData ? (
                    <Doughnut 
                        data={chartData} 
                        options={{
                            responsive: true,
                            plugins: { legend: { position: 'top' } }
                        }}
                    />
                ) : (
                    <p className="text-center py-10 text-gray-500">
                        Spending chart cannot be generated. (No spending data found).
                    </p>
                )}
            </div>
        </div>
    );
};

export default ChartTab;