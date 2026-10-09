import {Component,type ReactNode} from 'react';
import { createRoot } from 'react-dom/client';
import Steer from './Steer';
import './styles.css';
class RecoveryBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<div className="shell"><h1>Let’s reopen Steer.</h1><p>The app couldn’t display this screen. Your saved journal has not been cleared.</p><button className="primary" onClick={()=>window.location.reload()}>Reload Steer</button><p>Please keep your website data—it contains your journal.</p></div>:this.props.children;}
}
createRoot(document.getElementById('root')!).render(<RecoveryBoundary><Steer/></RecoveryBoundary>);
