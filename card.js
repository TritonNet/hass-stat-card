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
            popup: false
        };
    }

    openPopup() {
        this.popup = true;
    }

    cancelPopup() {
        this.popup = false;
    }

    async submitReading() {
        try {
            await this.hass.callService('input_number', 'set_value', {
                entity_id: 'input_number.calcium_reading',
                value: '15.0'
            });
        } catch (error) {
            console.error('Error calling service:', error);
        }
        this.popup = false;
    }

    render() {
        const _title = this.config.title || "Water Parameter";
        const _newvalue = this.config.new_value || false;

        return html`
           <ha-card header="${_title}">
             <div class="card-content">
               <table style='width: 100%'>
                 ${this.config.stats.map((stat) => {
                     const _readonly = stat.readonly || false;

                     return html`<tr>
                                    <td class='td-field ${_readonly ? `readonly` : ``}'>${stat.title}</td>
                                    <td class='td-value ${_readonly ? `readonly` : ``}'>${stat.value}</td>
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
                 <tr>
                    <td colspan=2 style='text-align: right;'>
                      <button class="flat-button" @click="${this.openPopup}">Record New Value</button>
                    </td>
                 </tr>
               </table>
               <div class="overlay"></div>
               <ha-card class="popup">
                 <div class="input-row">
                    <label for="value">New Calcium Reading:</label>
                    <input type="number" class="value-input" placeholder="Value" step="0.01" value='5'>
                    <span id="unit">ppm</span>
                 </div>
                 <div class="button-container">
                   <button class="flat-button flat-button-secondary" @click="${this.cancelPopup}">Cancel</button>
                   <button class="flat-button" @click="${this.submitReading}">Record New Value</button>
                 </div>
               </ha-card>
             </div>
           </ha-card>
         `;
    }

    updated(changedProperties) {
        if (changedProperties.has('popup')) {
            if (this.popup) {
                this.shadowRoot.querySelector('.overlay').style.display = 'block';
                this.shadowRoot.querySelector('.popup').style.display = 'block';
            } else {
                this.shadowRoot.querySelector('.overlay').style.display = 'none';
                this.shadowRoot.querySelector('.popup').style.display = 'none';
            }
        }
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

          .button-container {
            display: flex;
            justify-content: flex-end;
          }
          
          .button-container button {
            margin-left: 10px;
          }

          button, .flat-button {
            background-color: transparent;
            border: none;
            padding: 0;
            margin: 5px 0px 0px 0px;
            cursor: pointer;
          }
          
          .flat-button {
            display: inline-block;
            background-color: #3498db;
            color: #fff;
            border: 1px solid #3498db;
            padding: 5px 10px;
            text-align: center;
            text-decoration: none;
            font-size: 12px;
            border-radius: 0px;
            transition: background-color 0.3s, color 0.3s, border-color 0.3s;
          }

          .flat-button-secondary {
            background-color: #aaa69d;
            border: 1px solid #d1ccc0;
          }
          
          .flat-button:hover {
            background-color: #2980b9;
            border-color: #2980b9;
            color: #fff;
          }

          .flat-button-secondary:hover {
            background-color: #84817a;
            border: 1px solid #84817a;
          }

          .popup {
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 25px 25px 25px 0px;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
            z-index: 1001;
          }

          .overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            backdrop-filter: blur(5px);
            pointer-events: none;
          }

          .input-row {
              display: flex;
              justify-content: flex-end;
              align-items: center;
              margin-bottom: 20px;
            }

            .name-input {
              padding: 10px;
              width: 45%; /* Adjust the width as needed */
              border: 1px solid #ccc;
              border-radius: 5px;
              font-size: 16px;
            }

            .value-input {
              padding: 5px;
              width: 25%;
              border: 1px solid #ccc;
              border-radius: 0px;
              font-size: 16px;
              outline: none;
              text-align: right;
              margin-left: 50px;
              margin-right: 10px;
            }

            .value-input::placeholder {
              color: #ccc;
            }

            .value-input[type="number"] {
              appearance: none;
              -moz-appearance: textfield;
              -webkit-appearance: none;
            }

            .value-input[type="number"]::-webkit-inner-spin-button,
            .value-input[type="number"]::-webkit-outer-spin-button {
              appearance: none;
              -moz-appearance: none;
              -webkit-appearance: none;
              margin: 0;
            }
        `;
    }

    // required
    setConfig(config) {
        this.config = config;
    }
}

customElements.define('water-param-stat-card', WaterParamStatsCard);