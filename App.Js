import React, { useState } from "react";
import "./App.css";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

function App() {
  const [city, setCity] = useState("");
  const [chartData, setChartData] = useState(null);
  const [current, setCurrent] = useState(null);
  const [insight, setInsight] = useState("");
  const [error, setError] = useState("");

  const API_KEY = "YOUR_API_KEY";

 
  const fetchWeather = async () => {
    try {
      setError("");

      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
      );

      if (!res.ok) throw new Error("City not found");

      const data = await res.json();

      // Current Weather
      const currentData = {
        name: data.city.name,
        temp: data.list[0].main.temp,
        condition: data.list[0].weather[0].main,
      };

      setCurrent(currentData);

      const processed = processForecast(data);
      buildChart(processed);
      generateInsight(processed, data);
    } catch (err) {
      setError(err.message);
    }
  };

  const processForecast = (data) => {
    const dailyTemps = {};

    data.list.forEach((item) => {
      const date = item.dt_txt.split(" ")[0];

      if (!dailyTemps[date]) {
        dailyTemps[date] = [];
      }

      dailyTemps[date].push(item.main.temp);
    });

    return Object.keys(dailyTemps).map((date) => {
      const temps = dailyTemps[date];
      const avgTemp = temps.reduce((a, b) => a + b) / temps.length;

      return { date, temp: avgTemp };
    });
  };

  const buildChart = (data) => {
    setChartData({
      labels: data.map((d) => d.date),
      datasets: [
        {
          label: "Temperature (°C)",
          data: data.map((d) => d.temp),
          borderWidth: 2,
          tension: 0.3,
        },
      ],
    });
  };


  const generateInsight = (dailyData, rawData) => {
    let bestDay = dailyData[0];

    // Find best moderate temperature day
    dailyData.forEach((d) => {
      if (d.temp >= 20 && d.temp <= 30) bestDay = d;
    });

   
    const veryHot = dailyData.find((d) => d.temp > 35);
    const veryCold = dailyData.find((d) => d.temp < 5);

    const rain = rawData.list.find((item) => item.rain);

    if (veryHot) {
      setInsight(`🔥 Very hot day expected on ${veryHot.date}`);
    } else if (veryCold) {
      setInsight(`❄️ Cold weather expected on ${veryCold.date}`);
    } else if (rain) {
      const rainDate = rain.dt_txt.split(" ")[0];
      setInsight(`🌧️ Rain expected on ${rainDate}`);
    } else {
      setInsight(`✅ Best day to go out: ${bestDay.date}`);
    }
  };

  return (
    <div className="app">
      <h1>Weather Trend Planner</h1>

      <div className="controls">
        <input
          type="text"
          placeholder="Enter city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <button onClick={fetchWeather}>Search</button>
      </div>

      {error && <p className="error">{error}</p>}

      {current && (
        <div className="current">
          <h2>City: {current.name}</h2>
          <p>Temperature: {current.temp} °C</p>
          <p>Condition: {current.condition}</p>
        </div>
      )}

      {chartData && (
        <div className="chart">
          <Line data={chartData} />
        </div>
      )}

      {insight && <p className="insight">{insight}</p>}
    </div>
  );
}

export default App;

