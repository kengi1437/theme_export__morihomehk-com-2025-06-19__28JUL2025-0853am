class VariantSelects extends HTMLElement {
    constructor() {
        super();
        this.item = $(this).closest('.productView');
        this.isFullWidth = this.item.closest('.product-full-width').length == 1 || this.item.closest('.product-full-width-2').length == 1;

        this.onVariantInit();
        this.addEventListener('change', this.onVariantChange.bind(this));
    }

    onVariantInit(){
        this.updateOptions();
        this.updateMasterId();
        this.updateMedia(1500, 'init');
        // this.updateURL();
        this.renderProductAjaxInfo();
        this.renderProductInfo();
        if (!this.currentVariant) {
            this.updateAttribute(true);
        } else {
            this.updateAttribute(false, !this.currentVariant.available);
        }
        this.updateVariantStatuses();
    }
    
    onVariantChange(event) {
        this.updateOptions();
        this.updateMasterId();
        this.updatePickupAvailability();
        this.updateVariantStatuses();
      
        if (!this.currentVariant) {
            this.updateAttribute(true);
            this.updateStickyAddToCart(true);
        } else {
            this.updateMedia(200, 'change');
            if (!document.querySelector('.featured-product')) {
                this.updateURL();
            }
            this.updateVariantInput();
            this.renderProductAjaxInfo();
            this.renderProductInfo();
            this.updateProductInfo();
            this.updateAttribute(false, !this.currentVariant.available);
            this.updateStickyAddToCart(false, !this.currentVariant.available);
            this.checkQuantityWhenVariantChange();
        }
    }

    updateOptions() {
        this.options = Array.from(this.querySelectorAll('select'), (select) => select.value);
    }

    decodeOptions() {
        this.options = this.options.map(option => {
            const parsedOption = this.decodeOption(option)
            return parsedOption
        })
    }
  
    decodeOption(option) {
      if (option) {
          return option.split('Special_Double_Quote').join('"').split('Special_Slash').join('/')
        } else {
          return null
        }
    }

    encodeOption(option) {
        if (option) {
          return option.split('"').join('Special_Double_Quote').split('/').join('Special_Slash')
        } else {
          return null
        }
    }
    
    _strip(html) {
        if (!html) return null;
        var doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    }

    updateMasterId() {
        this.decodeOptions()
        this.currentVariant = this.getVariantData().find((variant) => {
            return !variant.options.map((option, index) => {
                return this.options[index] === this._strip(option);
            }).includes(false);
        });

        if (this.item.find('[data-filter]').length && this.currentVariant?.featured_media && this.currentVariant.featured_media.alt != null) {
            this.item.find('[data-filter]:checked').attr('data-value-default-lang', this.currentVariant?.featured_media.alt.toLowerCase().replace(/ /g,"-"));
        }
    }      

    updateMedia(time, status) {
        const enableVariantImageGroup = document?.querySelector('.enable_variant_image_group');
    
        if (enableVariantImageGroup && status == 'init') return;

        setTimeout(() => {
            if (!this.currentVariant || !this.currentVariant?.featured_media || document.querySelector('.productView-nav')?.matches('.media-filter')) return;
            
            const newMedia = document.querySelectorAll(
                `[data-media-id="${this.dataset.section}-${this.currentVariant.featured_media.id}"]`
            );
    
            if (!newMedia) return;
            window.setTimeout(() => {
                $(newMedia).trigger('click');
            }, time);
    
            if (!this.isFullWidth || window.innerWidth < 768 || !this.currentVariant) return;
            const mediaId = this.currentVariant.featured_media.id;
            const activeMedia = document?.querySelector(`.product-single__media[data-media-id="${mediaId}"]`);
            const fallbackImageContainer = document?.querySelector('.productView-image[data-index="1"]');

            if (activeMedia) {
                setTimeout(() => {
                    activeMedia.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 20);
            } else {
                const fallbackImage = fallbackImageContainer?.querySelector('img');
                const featuredImage = this.currentVariant?.featured_image;
                if (!featuredImage || !fallbackImage) return;

                fallbackImage.setAttribute('src', featuredImage.src);
                fallbackImage.setAttribute('srcset', featuredImage.src);
                fallbackImage.setAttribute('alt', featuredImage.alt);

                setTimeout(() => {
                    fallbackImageContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 20);
            }
        }, 1)
    }

    scrollToBlock(block) {
        const headerHeight = document.querySelectorAll('.section-header-navigation')[0]?.getBoundingClientRect().height 
        const announcementBarHeight = document.querySelectorAll('.announcement-bar')[0]?.getBoundingClientRect().height 
        const positionTop = block.getBoundingClientRect().top - headerHeight - announcementBarHeight 

        window.scrollTo({
            top: positionTop,
            behavior: 'smooth'
        })
    }

    updateURL() {
        if (!this.currentVariant) return;
        window.history.replaceState({ }, '', `${this.dataset.url}?variant=${this.currentVariant.id}`);
    }

    updateVariantInput() {
        const productForms = document.querySelectorAll(`#product-form-${this.dataset.product}, #product-form-installment-${this.dataset.product}`);

        productForms.forEach((productForm) => {
            const input = productForm.querySelector('input[name="id"]');
            input.value = this.currentVariant.id;
            input.dispatchEvent(new Event('change', { bubbles: true }));
        });
    }

    updatePickupAvailability() {
        const pickUpAvailability = document.querySelector('pickup-availability');
        if (!pickUpAvailability) return;

        if (this.currentVariant?.available) {
            pickUpAvailability.fetchAvailability(this.currentVariant.id);
        } else {
            pickUpAvailability.removeAttribute('available');
            pickUpAvailability.innerHTML = '';
        }
    }

    renderProductAjaxInfo() {
              if (!this.currentVariant) return;
        fetch(`${this.dataset.url}?variant=${this.currentVariant.id}&section_id=${this.dataset.section}`)
            .then((response) => response.text())
            .then((responseText) => {
                const id = `product-price-${this.dataset.product}`;
                const html = new DOMParser().parseFromString(responseText, 'text/html')
                const destination = document.getElementById(id);
                const source = html.getElementById(id);

                const property = `product-property-${this.dataset.product}`;
                const destinationProperty = document.getElementById(property);
                const sourceProperty = html.getElementById(property);

                if (source && destination) {
                    destination.innerHTML = source.innerHTML;
                }

                if (this.checkNeedToConvertCurrency()) {
                    let currencyCode = document.getElementById('currencies')?.querySelector('.active')?.getAttribute('data-currency');

                    Currency.convertAll(window.shop_currency, currencyCode, 'span.money', 'money_format');
                }

                if(destinationProperty) {
                    if (sourceProperty) {
                        destinationProperty.innerHTML = sourceProperty.innerHTML;
                        destinationProperty.style.display = 'table';
                    } else{
                        destinationProperty.style.display = 'none';
                    }
                } else if (sourceProperty) {
                    document.querySelector('.productView-product').insertBefore(sourceProperty, document.querySelector('.productView-options'));
                }

                document.getElementById(`product-price-${this.dataset.product}`)?.classList.remove('visibility-hidden');
                this.updateBadgeSale()
        });
    }

    renderProductInfo() {
          if (!this.currentVariant) return;
        if(this.item.find('[data-sku]').length > 0){
            this.item.find('[data-sku] .productView-info-value').text(this.currentVariant.sku);
        }

        if(this.item.find('[data-barcode]').length > 0){
            this.item.find('[data-barcode] .productView-info-value').text(this.currentVariant.barcode);
        }

        var inventory = this.currentVariant?.inventory_management;

        if(inventory != null) {
            var arrayInVarName = `product_inven_array_${this.dataset.product}`,
                inven_array = window[arrayInVarName];

            if(inven_array != undefined) {
                var inven_num = inven_array[this.currentVariant.id],
                    inputQuantity = this.item.find('input[name="quantity"]'),
                    buttonSubmit = this.item.find('button#product-add-to-cart'),
                    inventoryQuantity = parseInt(inven_num);

                if(inputQuantity.length > 0) {
                    inputQuantity.attr('data-inventory-quantity', inventoryQuantity);
                } else {
                    buttonSubmit.attr('data-inventory-quantity', inventoryQuantity);
                }

                if(this.item.find('[data-inventory]').length > 0){
                    if(inventoryQuantity > 0){
                        const showStock = this.item.find('[data-inventory]').data('stock-level');
                        if (showStock == 'show') {
                            this.item.find('[data-inventory] .productView-info-value').text(inventoryQuantity+' '+window.inventory_text.inStock);
                        }
                        else {
                            this.item.find('[data-inventory] .productView-info-value').text(window.inventory_text.inStock);
                        }
                    } else {
                        this.item.find('[data-inventory] .productView-info-value').text(window.inventory_text.outOfStock);
                    }
                }

                hotStock(inventoryQuantity);
            }
        }

        if(this.item.find('.productView-stickyCart').length > 0){
            const sticky = this.item.find('.productView-stickyCart');
            const optionSticky = sticky.find('.select__select');

            optionSticky.val(this.currentVariant.id);
        }
    }

    updateProductInfo() {
        fetch(`${this.dataset.url}?variant=${this.currentVariant.id}&section_id=${this.dataset.section}`)
            .then((response) => response.text())
            .then((responseText) => {
                const description = `[data-product-description-${this.dataset.product}]`
                const html = new DOMParser().parseFromString(responseText, 'text/html')
                const destinationDesc = document.querySelector(description);
                const sourceDesc = html.querySelector(description);

                if (sourceDesc && destinationDesc) {
                    destinationDesc.innerHTML = sourceDesc.innerHTML;
                    if (destinationDesc.closest('.toggle-content--height')){
                        destinationDesc.style.maxHeight = null;
                    }
                }
        });
    }

    updateAttribute(unavailable = true, disable = true){
        const addButton = document.getElementById(`product-form-${this.dataset.product}`)?.querySelector('[name="add"]');
        var quantityInput = this.item.find('input[name="quantity"]'),
            notifyMe = this.item.find('.productView-notifyMe'),
            hotStock = this.item.find('.productView-hotStock'),
            buttonAddtocart = this.item.find('.product-form__submit'),
            maxValue = parseInt(quantityInput.attr('data-inventory-quantity'));

        if (isNaN(maxValue)) {
            maxValue = maxValue = parseInt(buttonAddtocart.attr('data-inventory-quantity'));
        } else {
            maxValue = parseInt(quantityInput.attr('data-inventory-quantity'));
        }
        
        if(unavailable){
            var text = window.variantStrings.unavailable;

            quantityInput.attr('disabled', true);
            notifyMe.slideUp('slow');
            if (addButton != null){
                addButton.setAttribute('disabled', true);
                addButton.textContent = text;
            }
            quantityInput.closest('quantity-input').addClass('disabled');

            if(hotStock.length > 0) hotStock.addClass('is-hiden');
        } else {
            if (disable) {
                var text = window.variantStrings.soldOut,
                    subTotal = 0,
                    price = this.currentVariant?.price;

                const stickyPrice = $('[data-sticky-add-to-cart] .money-subtotal .money');
                const stickyComparePrice = $('[data-sticky-add-to-cart] .money-compare-price .money');

                if (window.subtotal.show) {
                    let qty = quantityInput.val() || 1;

                    subTotal = qty * price;
                    subTotal = Shopify.formatMoney(subTotal, window.money_format);
                    subTotal = extractContent(subTotal);

                    const moneySpan = document.createElement('span')
                    moneySpan.classList.add(window.currencyFormatted ? 'money' : 'money-subtotal')
                    moneySpan.innerText = subTotal
                    document.body.appendChild(moneySpan)

                    if (this.checkNeedToConvertCurrency()) {
                        let currencyCode = document.getElementById('currencies')?.querySelector('.active')?.getAttribute('data-currency');
                        Currency.convertAll(window.shop_currency, currencyCode, 'span.money', 'money_format');
                    }

                    subTotal = moneySpan.innerText
                    $(moneySpan).remove()

                    if (window.subtotal.style == '1') {
                        const pdView_subTotal = document.querySelector('.productView-subtotal .money') || document.querySelector('.productView-subtotal .money-subtotal');
                        if (pdView_subTotal != null) {
                            pdView_subTotal.textContent = subTotal;
                        }
                    } else if (window.subtotal.style == '2') {
                        text = window.subtotal.text.replace('[value]', subTotal);
                    }
                } else {
                    subTotal = Shopify.formatMoney(price, window.money_format);
                    subTotal = extractContent(subTotal);
                }

                quantityInput.attr('data-price', this.currentVariant?.price);
                quantityInput.attr('disabled', true);
                if (addButton != null){
                    addButton.setAttribute('disabled', true);
                    addButton.textContent = text;
                }
                quantityInput.closest('quantity-input').addClass('disabled');

                if (subTotal != 0 && stickyPrice.length) {
                    stickyPrice.text(subTotal);
                }

                const thisStickyPrice = $('[data-sticky-add-to-cart] .sticky-price');
                const thisComparePrice = $('[data-sticky-add-to-cart] .money-compare-price');
                const compare_at_price = this.currentVariant?.compare_at_price;
                const current_at_price = this.currentVariant?.price;

                if(compare_at_price == current_at_price) {
                    thisStickyPrice.removeClass('has-compare-price');
                    thisComparePrice.remove();
                } else {
                    if (compare_at_price) {
                        thisStickyPrice.addClass('has-compare-price');
                        if (thisComparePrice.length) {
                            thisComparePrice.attr('data-compare-price', compare_at_price);
                        } else {
                            thisStickyPrice.prepend(`<s class="money-compare-price" data-compare-price="${compare_at_price}"><span class="money"></span></s>`);
                        }
                    } else {
                        thisStickyPrice.removeClass('has-compare-price');
                        thisComparePrice.remove();
                    }
                }

                if (subTotal != 0 && stickyComparePrice.length && window.subtotal.show) {
                    let comparePrice = $('[data-sticky-add-to-cart] .money-compare-price').data('compare-price'),
                        qty = quantityInput.val() || 1;
                    comparePrice = qty * comparePrice;
                    comparePrice = Shopify.formatMoney(comparePrice, window.money_format);
                    comparePrice = extractContent(comparePrice);
                    stickyComparePrice.text(comparePrice);
                }

                if (notifyMe.length > 0) {
                    notifyMe.find('.halo-notify-product-variant').val(this.currentVariant.title);
                    notifyMe.find('.notifyMe-text').empty();
                    notifyMe.slideDown('slow');
                }
            } else {
                var text,
                    subTotal = 0,
                    price = this.currentVariant?.price;

                const stickyPrice = $('[data-sticky-add-to-cart] .money-subtotal .money');

                if (window.subtotal.show) {
                    let qty = quantityInput.val() || 1;

                    subTotal = qty * price;
                    subTotal = Shopify.formatMoney(subTotal, window.money_format);
                    subTotal = extractContent(subTotal);

                    const moneySpan = document.createElement('span')
                    moneySpan.classList.add(window.currencyFormatted ? 'money' : 'money-subtotal')
                    moneySpan.innerText = subTotal
                    document.body.appendChild(moneySpan)

                    if (this.checkNeedToConvertCurrency()) {
                        let currencyCode = document.getElementById('currencies')?.querySelector('.active')?.getAttribute('data-currency');
                        Currency.convertAll(window.shop_currency, currencyCode, 'span.money', 'money_format');
                    }

                    subTotal = moneySpan.innerText
                    $(moneySpan).remove()

                    if (window.subtotal.style == '1') {
                        const pdView_subTotal = document.querySelector('.productView-subtotal .money') || document.querySelector('.productView-subtotal .money-subtotal');
                        if (pdView_subTotal != null) {
                            pdView_subTotal.textContent = subTotal;
                        }

                        if (this.currentVariant.available && maxValue <= 0 && this.currentVariant.inventory_management == "shopify") {
                            text = window.variantStrings.preOrder;
                        } else {
                            text = window.variantStrings.addToCart;
                        }
                    } else if (window.subtotal.style == '2') {
                        if (this.currentVariant.available && maxValue <= 0 && this.currentVariant.inventory_management == "shopify") {
                            text = window.variantStrings.preOrder;
                        } else {
                            text = window.subtotal.text.replace('[value]', subTotal);
                            $('#show-sticky-product').text(text);
                            $('#product-sticky-add-to-cart').text(text);
                        }
                    }
                } else {
                    subTotal = Shopify.formatMoney(price, window.money_format);
                    subTotal = extractContent(subTotal);
                    if (this.currentVariant.available && maxValue <= 0 && this.currentVariant.inventory_management == "shopify") {
                        text = window.variantStrings.preOrder;
                    } else {
                        text = window.variantStrings.addToCart;
                    }
                }

                quantityInput.attr('data-price', this.currentVariant?.price);
                quantityInput.attr('disabled', false);
                if (addButton != null){
                    addButton.removeAttribute('disabled');
                    addButton.textContent = text;
                }
                quantityInput.closest('quantity-input').removeClass('disabled');

                if (subTotal != 0 && stickyPrice.length) {
                    stickyPrice.text(subTotal);
                }

                const thisStickyPrice = $('[data-sticky-add-to-cart] .sticky-price');
                const thisComparePrice = $('[data-sticky-add-to-cart] .money-compare-price');
                const compare_at_price = this.currentVariant?.compare_at_price;
                const current_at_price = this.currentVariant?.price;

                if(compare_at_price == current_at_price) {
                    thisStickyPrice.removeClass('has-compare-price');
                    thisComparePrice.remove();
                } else {
                    if (compare_at_price) {
                        thisStickyPrice.addClass('has-compare-price');
                        if (thisComparePrice.length) {
                            thisComparePrice.attr('data-compare-price', compare_at_price);
                            
                            const compare_at_price_sticky = Shopify.formatMoney(compare_at_price, window.money_format);
                            const comparePrice_sticky = extractContent(compare_at_price_sticky);
                            thisComparePrice.text(comparePrice_sticky);
                            
                            if (this.checkNeedToConvertCurrency()) {
                                let currencyCode = document.getElementById('currencies')?.querySelector('.active')?.getAttribute('data-currency');
                                Currency.convertAll(window.shop_currency, currencyCode, 'span.money', 'money_format');
                            }

                            thisStickyPrice.prepend(`<s class="money-compare-price" data-compare-price="${compare_at_price}"><span class="money"></span></s>`);
                            thisComparePrice.remove();
                        } else {
                            thisStickyPrice.prepend(`<s class="money-compare-price" data-compare-price="${compare_at_price}"><span class="money"></span></s>`);
                        }
                    } else {
                        thisStickyPrice.removeClass('has-compare-price');
                        thisComparePrice.remove();
                    }
                }

                const stickyComparePrice = $('[data-sticky-add-to-cart] .money-compare-price .money');
                if (subTotal != 0 && stickyComparePrice.length && window.subtotal.show) {
                    let comparePrice = $('[data-sticky-add-to-cart] .money-compare-price').data('compare-price'),
                        qty = quantityInput.val() || 1;
                    comparePrice = qty * comparePrice;
                    comparePrice = Shopify.formatMoney(comparePrice, window.money_format);
                    comparePrice = extractContent(comparePrice);
                    stickyComparePrice.text(comparePrice);
                }

                if (notifyMe.length > 0) {
                    notifyMe.slideUp('slow');
                }
            }
        }
    }

    updateStickyAddToCart(unavailable = true, disable = true){
        if(this.item.find('.productView-stickyCart').length > 0){
            const sticky = this.item.find('.productView-stickyCart');
            const itemImage = sticky.find('.sticky-image');
            const option = sticky.find('.select__select');
            const input = document.getElementById(`product-form-sticky-${this.dataset.product}`)?.querySelector('input[name="id"]');
            const button = document.getElementById(`product-form-sticky-${this.dataset.product}`)?.querySelector('[name="add"]');
            var quantityInput = this.item.find('input[name="quantity"]');
            var submitBtn = $('.product-form__submit');
            var maxValue;

            if (quantityInput.length > 0) {
                maxValue = parseInt(quantityInput.attr('data-inventory-quantity'));
            } else {
                maxValue = parseInt(submitBtn.attr('data-inventory-quantity'));
            }
          
            if(unavailable){
                var text = window.variantStrings.unavailable;

                button.setAttribute('disabled', true);
                button.textContent = text;
            } else {
                if (!this.currentVariant) return;

                const image = this.currentVariant?.featured_image;
                
                if (image != null) {
                    itemImage.find('img').attr({
                        'src': image.src,
                        'srcset': image.src,
                        'alt': image.alt
                    });
                }

                option.val(this.currentVariant.id);

                if (disable) {
                    var text = window.variantStrings.soldOut;

                    button.setAttribute('disabled', true);
                    button.textContent = text;
                } else {
                    if (this.currentVariant.available && maxValue <= 0 && this.currentVariant.inventory_management == "shopify") {
                        text = window.variantStrings.preOrder;
                    } else {
                        text = window.variantStrings.addToCart;
                    }

                    button.removeAttribute('disabled');
                    button.textContent = text;
                }

                input.value = this.currentVariant.id;
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    }

    getVariantData() {
        this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent);
        return this.variantData;
    }

    checkNeedToConvertCurrency() {
        var currencyItem = $('.dropdown-item[data-currency]');
        if (currencyItem.length) {
            return (window.show_multiple_currencies && Currency.currentCurrency != shopCurrency) || window.show_auto_currency;
        } else {
            return;
        }
    }

    checkQuantityWhenVariantChange() {
        var quantityInput = this.closest('.productView-details').querySelector('input.quantity__input')
        var maxValue = parseInt(quantityInput?.dataset.inventoryQuantity);
        var inputValue = parseInt(quantityInput?.value);

        let value = inputValue 

        if (inputValue > maxValue && maxValue > 0) {
            value = maxValue
        } else {
            value = inputValue
        }

        if (value < 1 || isNaN(value)) value = 1 
      
        if (quantityInput) {
          quantityInput.value = value
        }
      
        // document.getElementById('product-add-to-cart').dataset.available = this.currentVariant.available && maxValue <= 0
        const elementProductAddToCart = document.getElementById('product-add-to-cart');
        if (elementProductAddToCart && this.currentVariant?.available !== undefined && typeof maxValue !== 'undefined') {
            elementProductAddToCart.dataset.available = this.currentVariant.available && maxValue <= 0;
        }
    }

    updateVariantStatuses() {
        const inputWrappers = [...this.querySelectorAll('.product-form__input')];
        const variant_swatch = [...this.querySelectorAll('.product-form__swatch')];

        // 獲取當前所有選中的選項值
        const currentSelectedOptions = inputWrappers.map(wrapper =>
            wrapper.querySelector(':checked')?.value
        );

        inputWrappers.forEach((option, index) => {
            option.querySelector('[data-header-option]').innerText = option.querySelector(':checked').value;

            const optionInputs = [...option.querySelectorAll('input[type="radio"], option')];

            // 為每個選項計算可用性
            const optionInputsValue = [];
            const availableOptionInputsValue = [];

            // 遍歷所有可能的選項值
            optionInputs.forEach(input => {
                const testValue = input.getAttribute('value');

                // 創建測試選項組合
                const testOptions = [...currentSelectedOptions];
                testOptions[index] = testValue;

                // 檢查是否存在匹配的變體
                const matchingVariants = this.variantData.filter(variant => {
                    let matches = true;
                    for (let i = 0; i < testOptions.length; i++) {
                        if (testOptions[i] && variant[`option${i + 1}`] !== this._strip(testOptions[i])) {
                            matches = false;
                            break;
                        }
                    }
                    return matches;
                });

                if (matchingVariants.length > 0) {
                    optionInputsValue.push(testValue);

                    // 檢查是否有可用的變體
                    const availableVariants = matchingVariants.filter(variant => variant.available);
                    if (availableVariants.length > 0) {
                        availableOptionInputsValue.push(testValue);
                    }
                }
            });

            this.setInputAvailability(optionInputs, optionInputsValue, availableOptionInputsValue);

            if (variant_swatch.length > 1) {
                // 為圖片樣本更新使用第一個選項的變體
                const selectedOptionOneVariants = this.variantData.filter(variant =>
                    currentSelectedOptions[0] ? variant.option1 === this._strip(currentSelectedOptions[0]) : true
                );
                this.updateImageSwatch(selectedOptionOneVariants);
            }
        });
    }

    updateImageSwatch(selectedOptionOneVariants) {
        const inputWrappers = this.querySelectorAll('.product-form__input');
        if(inputWrappers){
            inputWrappers.forEach((element, inputIndex) => {
                const imageSpan = element.querySelectorAll("label>span.pattern");
                const imageLabel = element.querySelectorAll("label");
                const imageSpanImage = element.querySelectorAll("label>span.expand>img");
                const inputList = element.querySelectorAll("input");

                inputList.forEach((item, index) => {
                    const image = selectedOptionOneVariants.filter(tmp => {
                        if (inputIndex == 0) return tmp.option1 == item.value;
                        if (inputIndex == 1) return tmp.option2 == item.value;
                        if (inputIndex == 2) return tmp.option3 == item.value;
                    });
    
                    if(image.length > 0) {
                        imageLabel[index].style.display = "inline-block";
                        if (imageSpan[index] != undefined && image[0].featured_image != null) imageSpan[index].style.backgroundImage = `url("${image[0].featured_image.src}")`;
                        if (imageSpanImage[index] != undefined && image[0].featured_image != null) imageSpanImage[index].srcset = image[0].featured_image.src;
                    }
                    // else {
                    //     imageLabel[index].style.display = "none";
                    // }
                })
            });
        }
    }            

    setInputAvailability(optionInputs, optionInputsValue, availableOptionInputsValue) {
        optionInputs.forEach(input => {
            if (availableOptionInputsValue.includes(input.getAttribute('value'))) {
                input.classList.remove('soldout');
                input.innerText = input.getAttribute('value');
            } else {
                input.classList.add('soldout');
                optionInputsValue.includes(input.getAttribute('value')) ? input.innerText = input.getAttribute('value') + ' (Sold out)' : input.innerText = window.variantStrings.unavailable_with_option.replace('[value]', input.getAttribute('value'))
            }
        });
    }

    updateBadgeSale() {
        let badgeWrap = document.querySelector(".productView-badge");

        if (!badgeWrap) return;

        let badgeText = badgeWrap.querySelector(".productView-badge .badge.sale-badge"),
            badgeTextSaleType = badgeWrap.getAttribute('data-text-sale-badge'),
            priceCompare = document.querySelector(".productView-product .price__compare").getAttribute('data-compare'),
            priceLast = document.querySelector(".productView-product .price__sale .price__last").getAttribute('data-last'),
            percentSale = Math.round(((priceCompare - priceLast) / priceCompare) * 100);

        function renderSpan(text1, text2) {
            let spanElement = document.createElement('span');
            spanElement.classList.add('badge', 'sale-badge');
            let container = document.querySelector('.productView-badge');
            container.appendChild(spanElement);
            spanElement.innerText = `${text1} ${text2}%`
        }

        if (badgeWrap.classList.contains("has-badge-js")) {
            if (!priceCompare) {
                badgeWrap.querySelector(".badge.sale-badge")?.remove();
            } else {
                if (!badgeText) {
                    renderSpan(badgeTextSaleType, percentSale)
                } else {
                    badgeText.innerText = `${badgeTextSaleType} ${percentSale}%`
                }
            }
        } else {
            if (!priceCompare) {
                badgeWrap.querySelector(".badge.sale-badge")?.remove();
            } else {
                if (!badgeText) {
                    renderSpan(badgeTextSaleType, percentSale);
                } else {
                    badgeText.innerText = `${badgeTextSaleType}`
                }
            }
        }
    }
}

customElements.define('variant-selects', VariantSelects);

class VariantRadios extends VariantSelects {
    constructor() {
        super();
    }

    setInputAvailability(optionInputs, optionInputsValue, availableOptionInputsValue) {
        optionInputs.forEach(input => {
            if (availableOptionInputsValue.includes(input.getAttribute('value'))) {
                input.nextSibling.classList.remove('soldout', 'unavailable');
                input.nextSibling.classList.add('available');
            } else {
                input.nextSibling.classList.remove('available', 'unavailable');
                input.nextSibling.classList.add('soldout');

                if (window.variantStrings.hide_variants_unavailable && !optionInputsValue.includes(input.getAttribute('value'))) {
                    input.nextSibling.classList.add('unavailable')
                    if (!input.checked) return;
                    let inputsValue;
                    availableOptionInputsValue.length > 0 ? inputsValue = availableOptionInputsValue : inputsValue = optionInputsValue;
                    input.closest('.product-form__input').querySelector(`input[value="${inputsValue[0]}"]`).checked = true;
                    this.dispatchEvent(new Event('change'))
                }
            }
        });
    }
        
    updateOptions() {
        const fieldsets = Array.from(this.querySelectorAll('fieldset'));
        this.options = fieldsets.map((fieldset) => {
            return Array.from(fieldset.querySelectorAll('input')).find((radio) => radio.checked).value;
        });
    }
}

customElements.define('variant-radios', VariantRadios);

class QuantityInput extends HTMLElement {
    constructor() {
        super();
        if (this.closest('.quick-order-list__contents')) return; 
        this.input = this.querySelector('input');
        this.changeEvent = new Event('change', { bubbles: true });
        this.input.addEventListener('change', this.onInputChange.bind(this));

        this.querySelectorAll('button').forEach(
            (button) => button.addEventListener('click', this.onButtonClick.bind(this))
        );

        if (!this.checkHasMultipleVariants()) {
            this.initProductQuantity();
            this.checkVariantInventory();
        }
    }

    onInputChange(event) {
        event.preventDefault(); 
        var inputValue = this.input.value;
        var maxValue = parseInt(this.input.dataset.inventoryQuantity);
        var currentId = document.getElementById(`product-form-${this.input.dataset.product}`)?.querySelector('[name="id"]')?.value;
        var saleOutStock  = document.getElementById('product-add-to-cart')?.dataset.available === 'true' || false ;
        const addButton = document.getElementById(`product-form-${this.input.dataset.product}`)?.querySelector('[name="add"]');

        if(inputValue < 1) {
            inputValue = 1;

            this.input.value =  inputValue;
        }
        
        if (inputValue > maxValue && !saleOutStock && maxValue > 0) {
            var arrayInVarName = `selling_array_${this.input.dataset.product}`,
                itemInArray = window[arrayInVarName],
                itemStatus = itemInArray[currentId];
          
            if(itemStatus == 'deny') {
              inputValue = maxValue
              this.input.value = inputValue;
              const message = getInputMessage(maxValue)
              showWarning(message, 3000)
            }
        } else if (inputValue > maxValue && saleOutStock && maxValue <= 0) {
            this.input.value = inputValue;
        }

        if(window.subtotal.show) {
            var text,
                price = this.input.dataset.price,
                subTotal = 0;

            subTotal = inputValue * price;
            subTotal = Shopify.formatMoney(subTotal, window.money_format);
            subTotal = extractContent(subTotal);

            const moneySpan = document.createElement('span')
            moneySpan.classList.add(window.currencyFormatted ? 'money' : 'money-subtotal') 
            moneySpan.innerText = subTotal 
            document.body.appendChild(moneySpan) 

            if (this.checkNeedToConvertCurrency()) {
                let currencyCode = document.getElementById('currencies')?.querySelector('.active')?.getAttribute('data-currency');
                Currency.convertAll(window.shop_currency, currencyCode, 'span.money', 'money_format');
            }

            subTotal = moneySpan.innerText 
            $(moneySpan).remove()

            if (window.subtotal.style == '1') {
                const pdView_subTotal = document.querySelector('.productView-subtotal .money') || document.querySelector('.productView-subtotal .money-subtotal');

                pdView_subTotal.textContent = subTotal;
            }
            else if (window.subtotal.style == '2') {
                text = window.subtotal.text.replace('[value]', subTotal);
                $('#product-sticky-add-to-cart').text(text);
                if (addButton != null){
                    addButton.textContent = text;
                }
            }

            const stickyPrice = $('[data-sticky-add-to-cart] .money-subtotal .money');
            const stickyComparePrice = $('[data-sticky-add-to-cart] .money-compare-price .money');

            if (stickyPrice.length) {
                stickyPrice.text(subTotal);
            }

            if (stickyComparePrice.length && window.subtotal.show) {
                let comparePrice = $('[data-sticky-add-to-cart] .money-compare-price').data('compare-price');
                comparePrice = inputValue * comparePrice;
                comparePrice = Shopify.formatMoney(comparePrice, window.money_format);
                comparePrice = extractContent(comparePrice);
                stickyComparePrice.text(comparePrice);
            }
        }

        if (this.classList.contains('quantity__group--2') || this.classList.contains('quantity__group--3')) {
            const mainQty = document.querySelector('.quantity__group--1 .quantity__input');
            if (mainQty != null){
                mainQty.value = inputValue;
            }

            const mainQty2Exists = !!document.querySelector('.quantity__group--2 .quantity__input');
            const mainQty3Exists = !!document.querySelector('.quantity__group--3 .quantity__input');

            if (this.classList.contains('quantity__group--2') && mainQty3Exists) {
                const mainQty3 = document.querySelector('.quantity__group--3 .quantity__input');
                mainQty3.value = inputValue;
            }
            else if (this.classList.contains('quantity__group--3') && mainQty2Exists) {
                const mainQty2 = document.querySelector('.quantity__group--2 .quantity__input');
                mainQty2.value = inputValue;
            }
        }
    }

    onButtonClick(event) {
        event.preventDefault();
        const previousValue = this.input.value;
        
        event.target.name === 'plus' ? this.input.stepUp() : this.input.stepDown();
        if (previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);
    }

    checkNeedToConvertCurrency() {
        var currencyItem = $('.dropdown-item[data-currency]');
        if (currencyItem.length) {
            return (window.show_multiple_currencies && Currency.currentCurrency != shopCurrency) || window.show_auto_currency;
        } else {
            return;
        }
    }
    
    checkHasMultipleVariants() {
        const arrayInVarName = `product_inven_array_${this.querySelector('[data-product]').dataset.product}`
        this.inven_array = window[arrayInVarName];
        return Object.keys(this.inven_array).length > 1
    }
        
    initProductQuantity() {
        if(this.inven_array != undefined) {
            var inven_num = Object.values(this.inven_array),
                inventoryQuantity = parseInt(inven_num);

            this.querySelector('input[name="quantity"]').setAttribute('data-inventory-quantity', inventoryQuantity);
            this.querySelector('input[name="quantity"]').dataset.inventoryQuantity = inventoryQuantity
        }
    }

    checkVariantInventory() {
        const addBtn = document.getElementById('product-add-to-cart');
        if (!addBtn) return;
        this.input.disabled = addBtn.disabled;
        this.querySelector('.btn-quantity.minus').disabled = addBtn.disabled;
        this.querySelector('.btn-quantity.plus').disabled = addBtn.disabled;
    }

    getVariantData() {
        this.variantData = this.variantData || JSON.parse(document.querySelector('.product-option [type="application/json"]').textContent);
        return this.variantData;
    }
}

customElements.define('quantity-input', QuantityInput);

function hotStock(inventoryQuantity) {
    const productView = document.querySelector('.productView');
    const hotStock = productView.querySelector('.productView-hotStock');
    if(hotStock) {
        let hotStockText = hotStock.querySelector('.hotStock-text'),
            maxStock = parseFloat(hotStock.dataset.hotStock),
            textStock;

        if(inventoryQuantity > 0 && inventoryQuantity <= maxStock){
            hotStock.matches('.style-2') ? textStock  = window.inventory_text.hotStock2.replace('[inventory]', inventoryQuantity) : textStock  = window.inventory_text.hotStock.replace('[inventory]', inventoryQuantity);
            if (hotStockText) hotStockText.innerHTML = textStock;
            hotStock.classList.remove('is-hide');
        } else {
            hotStock.classList.add('is-hide');
        }

        if (hotStock.matches('.style-2')) {
            const invenProgress = inventoryQuantity / maxStock * 100,
                hotStockProgressItem = hotStock.querySelector('.hotStock-progress-item');
            if (hotStockProgressItem) hotStockProgressItem.style.width = `${invenProgress}%`;
        }
    }
}
const hotStockNoOptions = document.querySelector('.productView .productView-hotStock[data-current-inventory]');
if (hotStockNoOptions) {
    const inventoryQuantity = parseFloat(hotStockNoOptions.dataset.currentInventory);
    hotStock(inventoryQuantity);
}


function showWarning(content, time = null) {
    if (window.warningTimeout) {
        clearTimeout(window.warningTimeout);
    }
    const warningPopupContent = document.getElementById('halo-warning-popup').querySelector('[data-halo-warning-content]')
    warningPopupContent.textContent = content
    document.body.classList.add('has-warning')

    if (time) {
        window.warningTimeout = setTimeout(() => {
            document.body.classList.remove('has-warning')
        }, time)
    }
}

function getInputMessage(maxValue) {
    var message = window.cartStrings.addProductOutQuantity.replace('[maxQuantity]', maxValue);
    return message
}