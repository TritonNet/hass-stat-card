// Download latest from https://cdn.jsdelivr.net/gh/lit/dist@3.1.4/core/lit-core.min.js
import { LitElement, html, css, } from "./lit/2.4.0/core/lit-core.min.js";
import './numeric-textbox.js';

class WaterParamStatsCard extends LitElement {

    /*
      trackingEntities = {
         entity_id: "json state of the entity"
      }

      trackingEntityFields = {
        "field_value"
      }
    */

    static get properties() {
        return {
            hass: undefined,
            config: undefined,
            stateObj: undefined,
            popup: false,
            newEntryEnabled: false,
            newEntryEntityId: undefined,
            newEntryServerValue: undefined,
            newEntryLocalValue: undefined,
            newEntryLocalValueUpdated: false,
            html: undefined,
            trackingEntities: undefined,
            trackingEntityFields: undefined,
            configChangedApplied: false
        };
    }

    constructor() {
        // always call super() first
        super();

        this.newEntry = {};
        this.trackingEntities = {};
        this.trackingEntityFields = {};
        this.configChangedApplied = false;
        this.newEntryLocalValueUpdated = false;        
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


    // required
    setConfig(config) {        
        this.config = config;
        
        if (this.config.stats != undefined) {
            for (var idx = 0; idx < this.config.stats.length; idx++) {
                if (this.config.stats[idx] == undefined) {
                    continue;
                }

                const fieldValue = this.config.stats[idx].value;
                if (fieldValue == undefined) {
                    continue;
                }

                if (this.isTemplateValue(fieldValue)) {
                    const entities = this.extractEntities(fieldValue);
                    for (var n = 0; n < entities.length; n++) {
                        const entityid = entities[n];
                        this.trackingEntities[entityid] = this.trackingEntities[entityid];                        
                    }
                    this.trackingEntityFields[fieldValue] = this.trackingEntityFields[fieldValue] || {};
                    this.trackingEntityFields[fieldValue]["field_" + idx] = "template";
                }
            }
        }
        
        const _newEntry = this.config.new_entry;
        this.newEntryEnabled = _newEntry?.enabled || false;
        if (this.newEntryEnabled) {
            this.newEntryEntityId = _newEntry.entity;
            this.trackingEntities[this.newEntryEntityId] = this.trackingEntities[this.newEntryEntityId];
            this.trackingEntityFields[this.newEntryEntityId] = this.trackingEntityFields[this.newEntryEntityId] || {};
            this.trackingEntityFields[this.newEntryEntityId]["field_id_new_entry"] = "entityid";
        }

        this.configChangedApplied = false;
        this.reloadUI();
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

            if (this.newEntryEnabled) {
                this.newEntryServerValue = parseFloat(this.hass.states[this.newEntryEntityId].state);

                if (!this.newEntryLocalValueUpdated) {
                    this.newEntryLocalValue = this.newEntryServerValue;
                }
            }

            if (this.hasTrackingEntityChanged()) {
                this.reloadUI();
            }
        }
    }

    hasTrackingEntityChanged() {
        if (this.trackingEntities === undefined)
            return false;

        let _stateChanged = false;
        for (var entityid in this.trackingEntities) {
            const jstate = JSON.stringify(this.hass.states[entityid]);
            //console.log(jstate);
            if (this.trackingEntities[entityid] != jstate) {
                this.trackingEntities[entityid] = jstate;
                _stateChanged = true;
            }
        }

        return _stateChanged;
    }

    openPopup() {
        this.popup = true;
    }

    cancelPopup() {
        this.newEntryLocalValueUpdated = false;
        this.newEntryLocalValue = this.newEntryServerValue;
        this.popup = false;
    }

    isTemplateValue(value) {
        return value?.includes("{{");
    }

    async submitReading() {
        if (this.newEntryLocalValueUpdated) {
            try {
                await this.hass.callService('input_number', 'set_value', {
                    entity_id: this.newEntryEntityId,
                    value: this.newEntryLocalValue
                });
            } catch (error) {
                console.error('Error calling service:', error);
            }

            this.newEntryLocalValueUpdated = false;
            this.newEntryLocalValue = this.newEntryServerValue;
        }
        this.popup = false;
    }

    newEntryValueChanged(e) {
        this.newEntryLocalValueUpdated = true;
        this.newEntryLocalValue = e.detail;
    }

    getPopupWindow() {
        if (this.newEntryEnabled) {
            const _newEntry = this.config.new_entry;

            const _buttonText = _newEntry.button_text || "Record New Value"
            const _submitText = _newEntry.submit_text || "Record New Value"
            const _cancelText = _newEntry.cancel_text || "Cancel";
            const _label = _newEntry.label || this.hass.states[this.newEntryEntityId].attributes.friendly_name;

            const _uom = this.hass.states[this.newEntryEntityId].attributes.unit_of_measurement || "";
            const _step = this.hass.states[this.newEntryEntityId].attributes.step || 1;
            const _min = this.hass.states[this.newEntryEntityId].attributes.min || 0;
            const _max = this.hass.states[this.newEntryEntityId].attributes.max || 100;

            return html`<tr>
                           <td colspan=2 style='text-align: right;'>
                             <button class="flat-button" @click="${this.openPopup}">${_buttonText}</button>
                             <div class="overlay"></div>
                             <ha-card class="popup">
                               <numeric-textbox id="field_id_new_entry" uom="${_uom}" label="${_label}:" min="${_min}" max="${_max}" value="${this.newEntryLocalValue}" step="${_step}" @value-changed="${this.newEntryValueChanged}"></numeric-textbox>
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

    

    async waitUntil(condition, time = 100) {
        while (!condition()) {
            await new Promise((resolve) => setTimeout(resolve, time));
        }
    }

    async reloadFieldValues() {        
        for (var fieldValue in this.trackingEntityFields) {
            const fieldIds = this.trackingEntityFields[fieldValue];
            for (var fieldID in fieldIds) {
                const _element = this.shadowRoot.querySelector('#' + fieldID);
                //let _element = $('#' + fieldID);//.html( $("#name").val() );
                if (_element === null || _element === undefined)
                    continue;

                const fieldType = fieldIds[fieldID];
                switch (fieldType) {
                    case "template":
                        const _value = await this.getFieldValue(fieldValue);
                        //_element.innerHTML = _value;
                        _element.textContent = _value;
                        break;
                    case "entityid":
                        if (fieldID == "field_id_new_entry") {
                            this.newEntryServerValue = parseFloat(this.hass.states[fieldValue].state);
                            _element.set(this.newEntryServerValue);
                            //_element.text(this.newEntryServerValue);
                        }
                        else {
                            _element.innerHTML = this.hass.states[fieldValue].state;
                        }
                        break;
				}
            }
        }
    }

    async getFieldValue(fieldValue) {
        this._value = fieldValue;
            if (this.isTemplateValue(this._value)) {
                this._ready = false;
                
            await this.hass.connection.subscribeMessage((msg) => {
                    this._value = msg.result;
                    this._ready = true;                
            }, { type: "render_template", template: this._value });
                
            await this.waitUntil(() => this._ready === true);
        }

        return this._value;
    }

    async reloadUI() {        
        if (!this.configChangedApplied) {
            const _hassAvailable = this.hass !== undefined;
            await this.renderHtmlAsync();
            if (_hassAvailable) {
                this.configChangedApplied = true;
            }
        }
        else {
            await this.reloadFieldValues();
        }
    }

    async getStatsHtmlAsync() {
        let _statsHtml = html``;
        if (this.config.stats == undefined) {
            return _statsHtml;
        }

        for (var idx = 0; idx < this.config.stats.length; idx++) {
            const stat = this.config.stats[idx];
            if (stat == undefined) {
                continue;
            }

            const _type = stat.type || "value";
            switch (_type) {
                case "value":
                    const _readonly = stat.readonly || false;
                    const _value = await this.getFieldValue(stat.value);
                    _statsHtml = html`${_statsHtml}
                                     <tr>
                                        <td class='td-field ${_readonly ? `readonly` : ``}'><span>${stat.title}</span></td>
                                        <td class='td-value ${_readonly ? `readonly` : ``}'><span id="field_${idx}">${_value}</span></td>
                                     </tr>`;
                    break;
                case "header":
                    _statsHtml = html`${_statsHtml}
                                     <tr>
                                        <td class='td-header' colspan=2><span>${stat.title}</span></td>
                                     </tr>`;
                    break;
                default:
                    continue;
            } // switch
        } // for

        return _statsHtml;
    }

    async getChartHtmlAsync() {
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

    async getHtmlAsync() {
        const _statsHtml = await this.getStatsHtmlAsync();
        const _chartsHtml = await this.getChartHtmlAsync();
        
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

    async renderHtmlAsync() {
        this.html = html`<table><tr><td><span>Loading...</span></td></tr></table>`
        
        const validation = this.validateConfig();        
        if (!validation.is_valid)
            this.html = this.getErrorHtml(validation.error);
        else
            this.html = await this.getHtmlAsync();
    }

    render() { return this.html; }

    static get styles() {
        return css`
          
                  
        `;
    }
}

customElements.define('water-param-stat-card', WaterParamStatsCard);