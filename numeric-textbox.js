//import { LitElement, html, css, } from  "./lit/3.1.4/core/lit-core.min.js";
import { LitElement, html, css, } from  "https://cdn.jsdelivr.net/gh/lit/dist@3.1.4/core/lit-core.min.js";

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

    numDecimals() {
        if (this.step === undefined || this.step.toString().indexOf(".") < 0)
            return 0;

        return this.step.toString().split('.')[1].length;
    }

    round(n, dp) {
        const h = +('1'.padEnd(dp + 1, '0')) // 10 or 100 or 1000 or etc
        return Math.round(n * h) / h
    }

    decrement() { this.set(parseFloat(this.value) - parseFloat(this.step)); }

    increment() { this.set(parseFloat(this.value) + parseFloat(this.step)); }

    onChange(e) { this.set(e.target.value); }

    set(val) {
        this.value = this.round(val, this.numDecimals());
        const _max = parseFloat(this.max);
        const _min = parseFloat(this.min);

        if (this.value > _max)
            this.value = _max;
        else if (this.value < _min)
            this.value = _min;

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
                  <label for="value">${this.label}</label>
                  <div class="input-controls">
                      <button class="control-button" @click="${this.decrement}"><ha-icon icon="mdi:minus"></ha-icon></button>
                      <input type="number" class="value-input" step="${this.step}" .value='${this.value}' @input="${this.onChange}"/>
                      <button class="control-button" @click="${this.increment}"><ha-icon icon="mdi:plus"></ha-icon></button>
                      <span id="unit">${this.uom}</span>
                  </div>
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
               flex-direction: row;
           }
           
           .input-controls {
               display: flex;
               flex-direction: row;
               align-items: center;
           }
           
           .input-row label {
               margin-right: 10px;
           }
           
           .input-row span {
               margin-left: 10px;
           }
           
           @media (max-width: 500px) {
               .input-row {
                   flex-direction: column;
               }
               .input-row label {
                   margin-bottom: 10px;
                }
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

export { NumbericTextBox };