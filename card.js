import {
    LitElement,
    html,
    css,
} from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";
import { until } from 'https://unpkg.com/lit-html@2.0.1/directives/until.js';

class NumbericTextBox extends LitElement {
    static get properties() {
        return {
            label: undefined,
            value: undefined,
            step: undefined,
            min: undefined,
            max: undefined,
            uom: undefined
        }
    }

    decrement() {
        this.value = parseFloat(this.value) - parseFloat(this.step);
        this.notifyValueChanged();
    }

    increment() {
        this.value = parseFloat(this.value) + parseFloat(this.step);
        this.notifyValueChanged();
    }

    onChange(e) {
        this.value = e.target.value;
        this.notifyValueChanged();
    }

    notifyValueChanged() {
        this.dispatchEvent(new CustomEvent('value-changed', {
            detail: this.value
        }));
    }

    render() {
        return html`
                  <div class="input-row">
                     <label for="value">New ${this.label} Reading:</label>
                     <button class="control-button" @click="${this.decrement}"><ha-icon icon="mdi:minus"></ha-icon></button>
                     <input type="number" class="value-input" step="${this.step}" .value='${this.value}' @input="${this.onChange}"/>
                     <button class="control-button" @click="${this.increment}"><ha-icon icon="mdi:plus"></ha-icon></button>
                     <span id="unit">${this.uom}</span>
                  </div>`;
    }

    static get styles() {
        return css`
           .control-button {
               display: inline-block;
               text-align: center;
               text-decoration: none;
               font-size: 12px;
               border-radius: 0px;
               transition: background-color 0.3s, color 0.3s, border-color 0.3s;
               cursor: pointer;
               background-color: #262626;
               border: 0px solid #ccc;
               height: 38px;
           }

           .input-row {
                 display: flex;
                 justify-content: flex-end;
                 align-items: center;
                 margin-bottom: 20px;
                 margin-left: 35px;
           }
           
           .input-row label {
               margin-right: 10px;
           }
           
           .input-row span {
               margin-left: 10px;
           }

           .value-input {
             padding: 5px;
             width: 50px;
             border: 0px solid #ccc;
             border-radius: 0px;
             font-size: 16px;
             outline: none;
             text-align: right;
             background-color: #262626;
             height: 28px;
             font-weight: bold;
             color: var(--text-color);
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
}

customElements.define('numeric-textbox', NumbericTextBox);

class WaterParamStatsCard extends LitElement {
    static get properties() {
        return {
            hass: undefined,
            config: undefined,
            stateObj: undefined,
            popup: false,
            newEntryEnabled: false,
            newEntryEntityId: undefined,
            newEntryOriginalValue: undefined,
            newEntryCurrentValue: undefined,
            html: undefined
        };
    }

    // required
    setConfig(config) {
        this.config = config;

        if (this.newEntry === undefined)
            this.newEntry = {};

        const _newEntry = this.config.new_entry;
        this.newEntryEnabled = _newEntry?.enabled || false;
        if (this.newEntryEnabled) {
            this.newEntryEntityId = _newEntry.entity;
        }

        this.renderHtmlAsync();
    }

    updated(changedProperties) {
        if (changedProperties.has('popup')) {
            let _overlay = this.shadowRoot.querySelector('.overlay');
            let _popup = this.shadowRoot.querySelector('.popup');

            if (this.popup) {
                if (_overlay != undefined)
                    _overlay.style.display = 'block';

                if (_popup != undefined)
                    _popup.style.display = 'block';
            } else {
                if (_overlay != undefined)
                    _overlay.style.display = 'none';

                if (_popup != undefined)
                    _popup.style.display = 'none';
            }
        }
        else if (changedProperties.has('hass')) {

            if (this.newEntryEnabled) {
                this.newEntryCurrentValue = parseFloat(this.hass.states[this.newEntryEntityId].state)
                this.newEntryOriginalValue = this.newEntryCurrentValue;
            }

            this.renderHtmlAsync();
        }
    }

    openPopup() {
        this.popup = true;
    }

    cancelPopup() {
        this.newEntryCurrentValue = this.newEntryOriginalValue;
        this.popup = false;
    }

    isTemplate(value) {
        return value?.includes("{{");
    }

    async submitReading() {
        try {
            await this.hass.callService('input_number', 'set_value', {
                entity_id: this.newEntryEntityId,
                value: this.newEntryCurrentValue
            });
        } catch (error) {
            console.error('Error calling service:', error);
        }
        this.popup = false;
    }

    newEntryValueChanged(e) {
        this.newEntryCurrentValue = e.detail;
    }

    getPopupWindow() {
        if (this.newEntryEnabled) {
            const _newEntry = this.config.new_entry;

            const _buttonText = _newEntry.button_text || "Record New Value"
            const _submitText = _newEntry.submit_text || "Record New Value"
            const _cancelText = _newEntry.cancel_text || "Cancel";
            const _uom = this.hass.states[this.newEntryEntityId].attributes.unit_of_measurement || "";
            const _step = this.hass.states[this.newEntryEntityId].attributes.step || 1;
            const _min = this.hass.states[this.newEntryEntityId].attributes.min || 0;
            const _max = this.hass.states[this.newEntryEntityId].attributes.min || 100;

            return html`<tr>
                           <td colspan=2 style='text-align: right;'>
                             <button class="flat-button" @click="${this.openPopup}">${_buttonText}</button>
                             <div class="overlay"></div>
                             <ha-card class="popup">
                               <numeric-textbox uom="${_uom}" label="${this.config.title}" min="${_min}" max="${_max}" value="${this.newEntryCurrentValue}" step="${_step}" @value-changed="${this.newEntryValueChanged}"></numeric-textbox>
                               <div class="button-container">
                                 <button class="flat-button flat-button-secondary" @click="${this.cancelPopup}">${_cancelText}</button>
                                 <button class="flat-button" @click="${this.submitReading}">${_submitText}</button>
                               </div>
                             </ha-card>
                           </td>
                        </tr>`;
        }

        return html``;
    }

    validateConfig() {
        if (this.hass === undefined)
            return { is_valid: false, error: "Loading..." };

        if (this.newEntryEnabled) {
            if (this.newEntryEntityId === undefined)
                return { is_valid: false, error: "Entity must be specified for the new entry option." };

            const entity = this.hass.entities[this.newEntryEntityId];

            if (entity === undefined)
                return { is_valid: false, error: "Entity id '" + this.newEntryEntityId +"' is not found." };

            if (entity.platform != 'input_number')
                return { is_valid: false, error: "Only input_numbers are supported for new entry and entity id '" + this.newEntryEntityId + "' is not an input_number." };
        }

        return { is_valid: true };
    }

    async waitUntil(condition, time = 100) {
        while (!condition()) {
            await new Promise((resolve) => setTimeout(resolve, time));
        }
    }

    async getHtmlAsync() {
        const _title = this.config.title || "Water Parameter";
        let _statsHtml = html``;

        for (var idx = 0; idx < this.config.stats.length; idx++) {
            const stat = this.config.stats[idx];
            const _readonly = stat.readonly || false;

            this._value = stat.value;

            if (this.isTemplate(this._value)) {
                this.ready = false;

                await this.hass.connection.subscribeMessage((msg) => {
                    this._value = msg.result;
                    this.ready = true;
                }, { type: "render_template", template: this._value });

                await this.waitUntil(() => this.ready === true);
            }

            _statsHtml = html`${_statsHtml}
                        <tr>
                           <td class='td-field ${_readonly ? `readonly` : ``}'>${stat.title}</td>
                           <td class='td-value ${_readonly ? `readonly` : ``}'>${this._value}</td>
                        </tr>`;
		}

        return html`
           <ha-card header="${_title}">
             <div class="card-content">
               <table style='width: 100%'>
                 ${_statsHtml}
                 <tr>
                   <td colspan=2>
                     <div class='chart-container'>
                       <iframe class="chart-frame chart-frame-first" src="${this.config.charts.guage}"></iframe>
                       <iframe class="chart-frame chart-frame-second" src="${this.config.charts.timeseries}"></iframe>                       
                     </div>
                   </td>
                 </tr>
                 ${this.getPopupWindow()}                 
               </table>               
             </div>
           </ha-card>
         `;
    }

    getErrorHtml(error) {
        return html`<ha-alert alert-type="error">${error}</ha-alert>`;
    }

    async renderHtmlAsync() {
        this.html = html`<span>Loading...</span>`

        const validation = this.validateConfig();

        if (!validation.is_valid)
            this.html = this.getErrorHtml(validation.error);
        else
            this.html = await this.getHtmlAsync();

        this.requestUpdate();
        this.requestUpdate('value', this.newEntryOriginalValue);
    }

    render() { return this.html; }

    static get styles() {
        return css`
          
          .input-container {
            display: flex;
            align-items: center;
          }

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
            margin: 5px 0px 0px 0px;
            cursor: pointer;
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
        `;
    }
}

customElements.define('water-param-stat-card', WaterParamStatsCard);