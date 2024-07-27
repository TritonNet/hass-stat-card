// Download latest from https://cdn.jsdelivr.net/gh/lit/dist@3.1.4/core/lit-core.min.js
//import { LitElement, html, css, } from "./lit/3.1.4/core/lit-core.min.js";
import { LitElement, html, css, } from "https://cdn.jsdelivr.net/gh/lit/dist@3.1.4/core/lit-core.min.js";
import './numeric-textbox.js';

const LineType = Object.freeze({
    HEADER: 'header',
    VALUE: 'value'
});

const ValueType = Object.freeze({
    TEMPLATE: 'template',
    FIXED: 'fixed'
});
class StatsCard extends LitElement {

    static get properties() {
        return {
            hass: undefined,
            config: undefined,
            lines: [],
            entities: [],
            popup: false,
            newentry: undefined
        };
    }

    constructor() {
        // always call super() first
        super();

        this.lines = [];
        this.entities = [];
        this.newentry = { enabled: false };
    }

    setConfig(config) {
        this.config = config;
        
        let _lines = [];
        let _entities = [];
        if (this.config.stats != undefined) {
            for (var idx = 0; idx < this.config.stats.length; idx++) {
                if (this.config.stats[idx] == undefined) {
                    continue;
                }

                const _value = this.config.stats[idx].value;
                if (_value === undefined) {
                    continue;
                }

                const _isTemplate = this.isTemplateValue(_value);

                let _value_current = "0";
                const _value_type = _isTemplate ? ValueType.TEMPLATE : ValueType.FIXED;
                if (_value_type == ValueType.FIXED) {
                    _value_current = _value;
                }
                //else if (_value_type == ValueType.TEMPLATE) {
                //    const entities = this.extractEntities(_value);
                //    for (var idx = 0; idx < entities.length; idx++) {
                //        if (!_entities.includes(entities[idx])) {
                //            _entities.push(entities[idx]);
                //        }
                //    }
                //}
                
                const line = {
                    type: this.config.stats[idx].type || LineType.VALUE,
                    title: this.config.stats[idx].title,
                    value: {
                        type : _value_type,
                        config : _value,
                        current : _value_current,
                        subscription : undefined
                    },
                    readonly: this.config.stats[idx].readonly || false,
                };
                
                _lines.push(line);
            }
            this.entities = _entities;
            this.lines = _lines;
        }

        if (this.config.new_entry != undefined) {
            const _newentry = this.config.new_entry;
            this.newentry = {
                enabled: _newentry.enabled || false,
                entity_id: _newentry.entity,
                entity_last_changed: _newentry.entity_last_changed,
                label: _newentry.label,
                text_button : _newentry.button_text || "Record New Value",
                text_submit : _newentry.submit_text || "Submit",
                text_cancel : _newentry.cancel_text || "Cancel",
                value: { updated: false }
            };
        }
    }

    isTemplateValue(value) {
        return value?.includes("{{");
    }

    extractEntities(template) {
        const regex = /(?:states|state_attr|is_state|is_state_attr)\(['"]([^'"]+)['"]/g;
        const parameterNames = [];
        let match;

        while ((match = regex.exec(template)) !== null) {
            parameterNames.push(match[1]);
        }

        return parameterNames;
    }

    validateConfig() {
        if (this.hass === undefined)
            return { is_valid: false, error: "Loadingx..." };

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

    reloadlines() {
        if (this.hass === undefined)
            return false;

        for (var idx = 0; idx < this.lines.length; idx++) {
            const _line = this.lines[idx];
            if (_line == undefined) {
                continue;
            }

            if (_line.value.type == ValueType.FIXED) {
                continue;
            }

            if (_line.value.subscription != undefined) {
                continue;
            }

            const _cb = (msg) => {
                _line.value.current = msg.result;
            }

            const _msg = { type: "render_template", template: _line.value.config };

            _line.value.subscription = this.hass.connection.subscribeMessage(_cb, _msg);
        }

        return true;
    }

    updated(changedProperties) {
        if (changedProperties.has('popup')) {
            let _overlay = this.shadowRoot.querySelector('.overlay');
            let _popup = this.shadowRoot.querySelector('.popup');

            let _display = this.popup ? 'block' : 'none';

            if (_overlay != undefined)
                _overlay.style.display = _display;

            if (_popup != undefined)
                _popup.style.display = _display;
        }
        else if (changedProperties.has('hass')) {

            if (this.newentry.enabled) {
                this.newentry.value.server = parseFloat(this.hass.states[this.newentry.entity_id].state);

                if (!this.newentry.value.locally_changed) {
                    this.newentry.value.local = this.newentry.value.server;
                }
            }

            if(this.reloadlines())
            {
                this.requestUpdate();
            }
        }
    }

    getPopupWindow() {
        if (this.newentry.enabled === false || this.hass === undefined) {
            return html``;
        }

        const _entity_attr = this.hass.states[this.newentry.entity_id].attributes;

        const _label = this.newentry.label || _entity_attr.friendly_name;

        const _uom = _entity_attr.unit_of_measurement || "";
        const _step = _entity_attr.step || 1;
        const _min = _entity_attr.min || 0;
        const _max = _entity_attr.max || 100;
        console.log("this.newentry.value.local: " + this.newentry.value.local);
        return html`<tr>
                           <td colspan=2 style='text-align: right;'>
                             <button class="flat-button" @click="${this.openPopup}">${this.newentry.text_button}</button>
                             <div class="overlay"></div>
                             <ha-card class="popup">
                               <numeric-textbox id="field_id_new_entry" uom="${_uom}" label="${_label}:" min="${_min}" max="${_max}" value="${this.newentry.value.local}" step="${_step}" @value-changed="${this.newEntryValueChanged}"></numeric-textbox>
                               <div class="button-container">
                                 <button class="flat-button flat-button-secondary" @click="${this.cancelPopup}">${this.newentry.text_cancel}</button>
                                 <button class="flat-button" @click="${this.submitReading}">${this.newentry.text_submit}</button>
                               </div>
                             </ha-card>
                           </td>
                        </tr>`;
    }

    newEntryValueChanged(e) {
        this.newentry.value.locally_changed = true;
        this.newentry.value.local = e.detail;
    }

    async submitReading() {
        if (this.newentry.value.locally_changed) {
            try {
                await this.hass.callService('input_number', 'set_value', {
                    entity_id: this.newentry.entity_id,
                    value: this.newentry.value.local
                });

                if (this.newentry.entity_last_changed != undefined) {
                    await this.hass.callService('input_datetime', 'set_datetime', {
                        entity_id: this.newentry.entity_last_changed,
                        datetime: new Date()
                    });
                }

            } catch (error) {
                console.error('Error calling service:', error);
            }

            this.newentry.value.locally_changed = false;
            this.newentry.value.local = this.newentry.value.server;
        }
        this.popup = false;
    }

    openPopup() {
        this.popup = true;
    }

    cancelPopup() {
        this.popup = false;
    }

    getStatsHtml() {
        let _statsHtml = html``;
        if (this.lines == undefined) {
            return _statsHtml;
        }
        
        for (var idx = 0; idx < this.lines.length; idx++) {
            const _line = this.lines[idx];
            if (_line == undefined) {
                continue;
            }
            
            switch (_line.type) {
                case LineType.VALUE:
                    _statsHtml = html`${_statsHtml}
                                     <tr>
                                        <td class='td-field ${_line.readonly ? `readonly` : ``}'><span>${_line.title}</span></td>
                                        <td class='td-value ${_line.readonly ? `readonly` : ``}'><span id="field_${idx}">${_line.value.current}</span></td>
                                     </tr>`;
                    break;
                case LineType.HEADER:
                    _statsHtml = html`${_statsHtml}
                                     <tr>
                                        <td class='td-header' colspan=2><span>${_line.title}</span></td>
                                     </tr>`;
                    break;
                default:
                    continue;
            } // switch
        } // for
        
        return _statsHtml;
    }

    getChartHtml() {
        let _chartsHtml = html``;
        if (this.config.charts == undefined) {
            return _chartsHtml;
        }

        let hasChart = false;
        let _guageChartHtml = html``;
        if (this.config.charts.guage != undefined) {
            _guageChartHtml = html`
                  <iframe class="chart-frame chart-frame-first" src="${this.config.charts.guage}"></iframe>
                `;
            hasChart = true;
        }

        let _timeSeriesChartHtml = html``;
        if (this.config.charts.timeseries != undefined) {
            _timeSeriesChartHtml = html`
                  <iframe class="chart-frame chart-frame-second" src="${this.config.charts.timeseries}"></iframe>
                `;
            hasChart = true;
        }

        if (hasChart) {
            _chartsHtml = html`
                <tr>
                   <td colspan=2>
                     <div class='chart-container'>
                       ${_guageChartHtml}
                       ${_timeSeriesChartHtml}
                     </div>
                   </td>
                 </tr>
                `;
        }

        return _chartsHtml;
    }

    getHtml() {
        const _statsHtml = this.getStatsHtml();
        const _chartsHtml = this.getChartHtml();
        
        return html`
           <ha-card header="${this.config.title}">
             <div class="card-content">
               <table>
                 ${_statsHtml}
                 ${_chartsHtml}
                 ${this.getPopupWindow()}                 
               </table>               
             </div>
           </ha-card>
         `;
    }

    getErrorHtml(error) {
        return html`<ha-alert alert-type="error">${error}</ha-alert>`;
    }

    render() {
        const validation = this.validateConfig();        
        if (!validation.is_valid)
            return this.getErrorHtml(validation.error);
        else
            return this.getHtml();
    }

    static get styles() {
        return css`
          .input-container {
            display: flex;
            align-items: center;
          }

          table {
            width: 100%,
            table-layout: fixed;
            border-collapse: collapse;
          }
          .td-field {
            width: 100%;
            flex: 1;
          }

          .td-header {
            background-color: #383a3b;
          }

          .readonly {
            color: #666666;
          }

          .td-value { 
              white-space: nowrap;
              text-align: right;
          }

          .chart-container {
            width: 100%; 
            height: auto; 
            display: flex; 
            flex-wrap:nowrap;
          }

          .chart-frame {
            border: none; 
            margin: 0; 
            padding: 0;
          }

          .chart-frame-first {
            width: 40%;
          }

          .chart-frame-second {
            width: 60%;
          }

          @media (max-width: 400px) {
            .chart-container {
              flex-direction: column;
            }
            .chart-frame {
              width: 100%;
            }
          }

          .button-container {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
          }
          
          .button-container button {
            margin-left: 10px;
          }

          .flat-button {
            background-color: #007bff;
            border: none;
            color: #ffffff;
            padding: 5px 15px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 20px;
          }

          .flat-button-secondary {
            background-color: #6c757d;
          }
          
          .flat-button:hover {
            background-color: #0056b3;
          }

          .flat-button-secondary:hover {
            background-color: #5a6268;
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

customElements.define('stats-card', StatsCard);