import { useState, useEffect, useRef} from 'react';
import './App.css';
import beepMp3 from './assets/beep.mp3';

/* Had to use React 17 instead of 18 to pass FCC test #14 due to incompatibility issues
Sometimes the tests would fail due to FCC speeding up the clock, which is not our code's issue*/
function App() {
	const MAXLENGTH = 60;
	const MINLENGTH = 1; // min 1 instead of 0 to pass the fcc tests

	const [breakLength, setBreakLength] = useState(5);
	const [sessionLength, setSessionLength] = useState(25);
	const [timerLength, setTimerLength] = useState(sessionLength * 60 * 1000); // timer display in ms
	const [isPause, setIsPause] = useState(true);
	const [timeElapsed, setTimeElapsed] = useState(0); // in ms
	const [timerLabel, setTimerLabel] = useState("Session");
	const [intervalId, setIntervalId] = useState<number | null>(null);

	const audioRef = useRef<HTMLAudioElement | null>(null);


	const sessionChange = (value: string) => {
		if (isPause) {
			setTimeElapsed(0);
			if (value === "+" && (sessionLength < MAXLENGTH)) {
				setSessionLength((prevSessionLength) => {
					setTimerLength( (prevSessionLength + 1) * 60 * 1000);
					return prevSessionLength + 1;
				});
			}
			else if (value === "-" && (sessionLength > MINLENGTH)) {
				setSessionLength((prevSessionLength) => {
					setTimerLength((prevSessionLength - 1) * 60 * 1000) ;
					return prevSessionLength - 1;
				});
			}
		}
	}

	const reset = () => {
		setTimerLabel("Session");
		clearInterval(intervalId ?? undefined);
		setIsPause(true);
		setBreakLength(5);
		setSessionLength(25);
		setTimerLength(25 * 60 * 1000);
		setTimeElapsed(0);
		stopAudio();
	}


	const start_stop = () => {
		setIsPause((prevIsPause) => !prevIsPause);
	};

	const addOneSecond = () => {
		// Use the latest current state by the functional update of setIsPause
		setIsPause((prevIsPause) => {
			// latest isPause state
			if (!prevIsPause) {
				setTimeElapsed((prevTimeElapsed) => {
					//console.log("Not paused");
					//console.log(`prevTimeElapsed: ${prevTimeElapsed + 1000} TimerLength: ${timerLength}`);
					return prevTimeElapsed + 1000;
				});
			}
			return prevIsPause;
		})
	};

	const startSessionInterval = () => {
		return setInterval(() => {
			setIntervalId((prevIntervalId) => {
				if (isPause) {
					clearInterval(prevIntervalId ?? undefined);
					return null;
				}
				// Case where timeElapsed>timerLength is handled with the useEffect function below.
				else {
					// isPause may have changed from the above code but it is still using the initial state when useEffect commenced.
					addOneSecond();
					return prevIntervalId;
				}
			});
		}, 1000); //This returns an interval ID
	};

	const playAudio = () => {
		if (audioRef.current) {
			audioRef.current.play();
		}
	};

	const stopAudio = () => {
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.currentTime = 0;
		}
	};

	// Handles case where timeElapsed reaches timerLength
	useEffect(() => {
		// using greater here to ensure the timer goes to 00:00 to pass the fcc tests
		if (timeElapsed >= timerLength) {
			if (timerLabel === "Session") {
				// Session complete, switch to Break
				setTimerLabel("Break");
				setTimerLength(breakLength * 60 * 1000);
			}
			else if (timerLabel === "Break") {
				// Session complete, switch to Break
				setTimerLabel("Session");
				setTimerLength(sessionLength * 60 * 1000);
			}
			playAudio();
			setTimeElapsed(0);
		} 
	}, [timeElapsed]);


	// useEffect dependent on isPause will handle everything to do with the intervals
	useEffect(() => {
		if (!isPause && !intervalId) {
			// Start a new interval only if it's not paused and there's no existing interval
			const id = startSessionInterval();
			setIntervalId(id);
		}
		return () => {
			// Clear the interval when the component unmounts or when it's paused
			clearInterval(intervalId ?? undefined);
			setIntervalId(null);
		};
	}, [isPause]);

	return (
		<div id="container">
			<p id="title">Pomodoro Flow</p>
			<div className="length-control">
				<div className="length-settings">
					<div id="break-label">Break Length</div>
					<div id="break-length">{breakLength}</div>
					<button className="btn-level" id="break-decrement" onClick={() => { (breakLength > MINLENGTH) && isPause ? setBreakLength(breakLength - 1) : null } } >
						<i className="fa-solid fa-square-caret-down"></i>
					</button>
					<button className="btn-level" id="break-increment" value="+" onClick={() => {(breakLength < MAXLENGTH) && isPause ? setBreakLength(breakLength + 1) : null } } >
						<i className="fa-solid fa-square-caret-up"></i>
					</button>
				</div>
				<div className="length-settings">
					<div id="session-label">Session Length</div>
					<div id="session-length">{sessionLength}</div>
				<button className="btn-level" id="session-decrement" value="-" onClick={() => sessionChange("-") } >
						<i className="fa-solid fa-square-caret-down"/>
					</button>
					<button className="btn-level" id="session-increment" value="+" onClick={() => sessionChange("+") } >
						<i className="fa-solid fa-square-caret-up"></i>
					</button>
				</div>
			</div>
			<div id="timer">
				<div id="timer-label">{timerLabel}</div>
				<div id="time-left">{`${String(Math.floor((((timerLength - timeElapsed) / (60 * 1000))))).padStart(2, '0')}:${String( Math.floor(((timerLength - timeElapsed) / 1000) % 60)).padStart(2, '0') }`}</div>
				<div id="timer-control">
					<button id="start_stop" className="btn-level" onClick={start_stop} >
						<i className="fa-solid fa-play"></i>
						<i className="fa-solid fa-pause"></i>
					</button>
					<button id="reset" className="btn-level" onClick={reset} >
						<i className="fas fa-sync-alt"></i>
					</button>
				</div>
			</div>
			<div>
				<audio id="beep" ref={audioRef} src={beepMp3}>
					Your browser does not support the audio element.
				</audio>
			</div>
		</div>
	)
}

export default App
