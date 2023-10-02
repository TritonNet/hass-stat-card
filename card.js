import {
    LitElement,
    html,
    css,
} from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";

class WaterParamStatsCard extends LitElement {
    static get properties() {
        return {
            hass: undefined,
            config: undefined,
            stateObj: undefined,
        };
    }

    render() {
        return html`
           <ha-card header="${this.config.title}">
             <div class="card-content">
               <table style='width: 100%'>
                 ${
                     this.config.stats.map((stat) => {
                        return html`<tr>
                                      <td class='td-field ${stat.readonly?`readonly`:``}'>${stat.title}</td>
                                      <td class='td-value ${stat.readonly?`readonly`:``}'>${stat.value}</td>
                                   </tr>`
                     })
                 }
                 <tr>
                   <td colspan=2>
                     <div class='chart-container'>
                       <iframe class="chart-frame chart-frame-first" src="${this.config.charts.guage}"></iframe>
                       <iframe class="chart-frame chart-frame-second" src="${this.config.charts.timeseries}"></iframe>
                     </div>
                   </td>
                 </tr>
               </table>
             </div>
           </ha-card>
         `;
    }

    static get styles() {
        return css`
          table {
            width: 100%;
            border-collapse: collapse;
          }
          .td-field {            
            width: 80%;
          }

          .readonly {
            color: #666666;
          }

          .td-value {            
            width: 20%;
          }

          .chart-container {
            width: 100%; 
            height: 250px; 
            display: flex; 
            flex-wrap:nowrap;
          }

          .chart-frame {
            border: none; 
            margin: 0; 
            padding: 0;
          }

          .chart-frame-first {
            flex: 2; 
            width: 40%;
          }

          .chart-frame-second {
            flex: 3; 
            width: 60%;
          }
        `;
    }

    // required
    setConfig(config) {
        this.config = config;
    }
}

customElements.define('water-param-stat-card', WaterParamStatsCard);