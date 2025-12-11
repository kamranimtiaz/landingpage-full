/******************************************************************************
 * DATE PICKER & FORM SETUP
 *****************************************************************************/

document.addEventListener("DOMContentLoaded", function () {
  // Fix Webflow's automatic "http://#" action attribute
  const form = document.querySelector("form[data-hotel-code]");
  if (form && form.getAttribute("action") === "http://#") {
    form.setAttribute("action", "#");
  }

  // Populate traffic-origin field with current page URL
  const trafficOriginField = document.querySelector('input[name="traffic-origin"], input[id="traffic-origin"]');
  if (trafficOriginField) {
    trafficOriginField.value = window.location.href;
    console.log('Traffic origin set to:', window.location.href);
  }

  let heroSelectedDates = [];
  let heroAdultsCount = 2;
  let heroChildrenCount = 0;
  let formAdultsCount = 2;
  let formChildrenCount = 0;
  let formDateInstance = null;

  // Kinder-Alter Felder anzeigen/ausblenden je nach Anzahl
  function updateChildAgeItems(childCount) {
    const wrapper = document.querySelector("[data-child-age-element]");
    if (!wrapper) return;
    const items = wrapper.querySelectorAll("[data-child-age-item]");
    const count = Math.max(0, Math.min(childCount || 0, items.length));

    // Wrapper Sichtbarkeit
    if (count > 0) {
      wrapper.style.display = "block";
      wrapper.setAttribute("aria-hidden", "false");
    } else {
      wrapper.style.display = "none";
      wrapper.setAttribute("aria-hidden", "true");
    }

    items.forEach((item, index) => {
      const shouldShow = index < count;
      const inputs = item.querySelectorAll("input, select, textarea");
      if (shouldShow) {
        item.style.display = "block";
        item.setAttribute("aria-hidden", "false");
        // Aktivieren und Namen wiederherstellen
        inputs.forEach((inp) => {
          if (inp.dataset.originalName && !inp.name) {
            inp.name = inp.dataset.originalName;
          }
          inp.disabled = false;
        });
        // Required aktivieren (wird von der bestehenden Validierung genutzt)
        item.setAttribute("data-required", "");
      } else {
        item.style.display = "none";
        item.setAttribute("aria-hidden", "true");
        // Required deaktivieren, damit Validierung nicht greift
        item.removeAttribute("data-required");
        // Eingaben leeren und von Submission ausschließen
        inputs.forEach((inp) => {
          if (!inp.dataset.originalName) {
            inp.dataset.originalName = inp.getAttribute("name") || "";
          }
          inp.value = "";
          inp.disabled = true;
          inp.removeAttribute("name");
        });
      }
    });
  }

  // Hilfsfunktionen: Limitierung und Button-States für Kinderzahl
  function getMaxChildrenSelectable() {
    const wrapper = document.querySelector("[data-child-age-element]");
    if (!wrapper) return Infinity; // Kein Altersbereich vorhanden → kein hartes Limit
    const items = wrapper.querySelectorAll("[data-child-age-item]");
    const len = items ? items.length : 0;
    return len > 0 ? len : Infinity; // Wenn 0 Items vorhanden, nicht künstlich auf 0 deckeln
  }

  function clampChildrenCount(value) {
    const max = getMaxChildrenSelectable();
    let v = typeof value === "number" ? value : 0;
    if (v < 0) v = 0;
    if (max !== Infinity && v > max) v = max;
    return v;
  }

  function updateChildPlusMinusState(wrapperEl, currentCount) {
    if (!wrapperEl) return;
    const minusB = wrapperEl.querySelector('[data-controls="minus"]');
    const plusB = wrapperEl.querySelector('[data-controls="plus"]');
    if (minusB) {
      if (currentCount === 0) minusB.classList.add("is-disabled");
      else minusB.classList.remove("is-disabled");
    }
    const max = getMaxChildrenSelectable();
    if (plusB) {
      if (max !== Infinity && currentCount >= max)
        plusB.classList.add("is-disabled");
      else plusB.classList.remove("is-disabled");
    }
  }

  function formatFancyRange(selectedDates, instance) {
    if (!selectedDates || selectedDates.length < 1) return "";
    return selectedDates
      .map(function (d) {
        return instance.formatDate(d, instance.config.dateFormat);
      })
      .join(" bis ");
  }

  function formatTechnicalRange(selectedDates) {
    if (!selectedDates || selectedDates.length < 1) return "";
    return selectedDates
      .map(function (d) {
        let yyyy = d.getFullYear();
        let mm = ("0" + (d.getMonth() + 1)).slice(-2);
        let dd = ("0" + d.getDate()).slice(-2);
        return yyyy + "-" + mm + "-" + dd;
      })
      .join(" - ");
  }

  function updateNightsDisplay(selectedDates) {
    const nightsEl = document.querySelector("[data-summary-nights]");
    const container = nightsEl
      ? nightsEl.closest(".form_picker-nights-wrapper")
      : null;

    if (!nightsEl || !container) return;

    if (!selectedDates || selectedDates.length < 2) {
      container.style.visibility = "hidden";
      return;
    }

    const diff = Math.round((selectedDates[1] - selectedDates[0]) / 86400000);
    const nights = diff < 1 ? 1 : diff;
    container.style.visibility = "visible";

    const label = tCount("nights", nights);
    nightsEl.textContent = label;
    // Suffix-Text setzen (bevorzugt data-Attribut, sonst <em> im Wrapper)
    const suffixEl =
      container.querySelector("[data-summary-nights-suffix]") ||
      container.querySelector("em");
    if (suffixEl) {
      suffixEl.textContent = t("nightsSuffix");
    }
  }

  if (window.innerWidth >= 992) {
    setTimeout(function () {
      const compEl = document.querySelector(".picker_component");
      if (compEl) compEl.classList.add("show");

      flatpickr(".picker_date", {
        mode: "range",
        dateFormat: "D., d. M.",
        minDate: "today",
        locale: resolveFlatpickrLocale(),
        static: true,
        position: "above",
        onReady: function (selectedDates, dateStr, instance) {
          const cal = instance.calendarContainer;
          if (cal) {
            cal.classList.add("picker_initial-position");
            const extra = cal.querySelectorAll("input[name^='field']");
            extra.forEach((f) => f.removeAttribute("name"));
          }
        },
        onChange: function (sel, ds, inst) {
          heroSelectedDates = sel;
          const heroTextEl = document.querySelector(
            '[data-picker="date-text"]'
          );
          if (heroTextEl) {
            if (heroTextEl.value !== undefined) {
              heroTextEl.value = ds || t("selectDates");
            } else {
              heroTextEl.textContent = ds || t("selectDates");
            }
          }
        },
      });

      (function () {
        const pickerTrigger = document.querySelector(
          '[data-open-popup-persons=""]'
        );
        const pickerPopup = document.querySelector('[data-popup-persons=""]');
        const pickerText = document.querySelector(
          '[data-picker="persons-text"]'
        );
        const adultsCounterText = document.querySelector(
          '[data-counter="adults-text"]'
        );
        const childrenCounterText = document.querySelector(
          '[data-counter="childs-text"]'
        );
        const closeButton = pickerPopup
          ? pickerPopup.querySelector('[data-custom="submit-person"]')
          : null;
        const controls = pickerPopup
          ? pickerPopup.querySelectorAll("[data-controls]")
          : null;
        if (!pickerTrigger || !pickerPopup || !closeButton || !controls) return;

        pickerTrigger.addEventListener("click", function () {
          if (pickerPopup.getAttribute("aria-hidden") === "true") {
            pickerPopup.style.display = "block";
            pickerPopup.style.opacity = 0;

            requestAnimationFrame(() => {
              pickerPopup.style.opacity = 1;
              pickerPopup.setAttribute("aria-hidden", "false");
              pickerTrigger.setAttribute("aria-expanded", "true");
            });
          }
        });

        function closePopup() {
          // Erst den Fokus entfernen
          const focusedElement = document.activeElement;
          if (focusedElement && pickerPopup.contains(focusedElement)) {
            focusedElement.blur();
          }

          pickerTrigger.setAttribute("aria-expanded", "false");
          pickerPopup.style.opacity = 0;

          // Warten auf das Ende der Animation
          setTimeout(() => {
            pickerPopup.style.display = "none";
            pickerPopup.setAttribute("aria-hidden", "true");
          }, 300);
        }

        closeButton.addEventListener("click", function () {
          if (pickerText) {
            const txt = personsSummary(heroAdultsCount, heroChildrenCount);
            if (pickerText.value !== undefined) {
              pickerText.value = txt;
            } else {
              pickerText.textContent = txt;
            }
          }
          closePopup();
        });

        document.addEventListener("click", function (e) {
          if (!pickerPopup.contains(e.target) && e.target !== pickerTrigger) {
            closePopup();
          }
        });

        controls.forEach(function (ctrl) {
          ctrl.addEventListener("click", function () {
            const t = ctrl.getAttribute("data-controls");
            const wrap = ctrl.closest(".picker_persons-wrapper");
            const cEl = wrap.querySelector("[data-counter]");
            const cType = cEl ? cEl.dataset.counter : "";
            if (cType === "adults-text") {
              if (t === "plus") heroAdultsCount++;
              else if (t === "minus" && heroAdultsCount > 1) heroAdultsCount--;
              if (adultsCounterText) {
                const valA = tCount("adults", heroAdultsCount);
                if (adultsCounterText.value !== undefined)
                  adultsCounterText.value = valA;
                else adultsCounterText.textContent = valA;
              }
              const minusB = wrap.querySelector('[data-controls="minus"]');
              if (minusB) {
                if (heroAdultsCount === 1) minusB.classList.add("is-disabled");
                else minusB.classList.remove("is-disabled");
              }
            } else if (cType === "childs-text") {
              if (t === "plus") heroChildrenCount++;
              else if (t === "minus" && heroChildrenCount > 0)
                heroChildrenCount--;
              heroChildrenCount = clampChildrenCount(heroChildrenCount);
              if (childrenCounterText) {
                const valC = tCount("children", heroChildrenCount);
                if (childrenCounterText.value !== undefined)
                  childrenCounterText.value = valC;
                else childrenCounterText.textContent = valC;
              }
              updateChildPlusMinusState(wrap, heroChildrenCount);
            }
          });
        });
        // Initial-States für Kinderreihe im Hero-Popup
        const childRow = Array.from(
          pickerPopup.querySelectorAll(".picker_persons-wrapper")
        ).find(
          (w) =>
            w.querySelector("[data-counter]")?.dataset.counter === "childs-text"
        );
        if (childRow)
          updateChildPlusMinusState(
            childRow,
            clampChildrenCount(heroChildrenCount)
          );
      })();

      const heroRequestBtn = document.querySelector(
        '[data-custom="transfer-hero-data"]'
      );
      if (heroRequestBtn) {
        heroRequestBtn.addEventListener("click", function () {
          if (heroSelectedDates && heroSelectedDates.length > 0) {
            window.__heroData = {
              dates: heroSelectedDates,
              adults: heroAdultsCount,
              children: heroChildrenCount,
            };

            // Update form date
            if (formDateInstance) {
              formDateInstance.setDate(window.__heroData.dates, false);
              const fancy = formatFancyRange(
                window.__heroData.dates,
                formDateInstance
              );
              const tech = formatTechnicalRange(window.__heroData.dates);

              const formDateVisible = document.querySelector(
                '.form_picker-date[data-picker="date-text-form"]'
              );
              const formDateHidden = document.querySelector(
                '[data-picker="date-hidden-form"]'
              );

              if (formDateVisible) formDateVisible.value = fancy || "";
              if (formDateHidden) formDateHidden.value = tech;
            }

            // Transfer adults and children counts
            formAdultsCount = heroAdultsCount;
            formChildrenCount = clampChildrenCount(heroChildrenCount);

            // Update form persons display
            const pCont = document.querySelector(".form_picker-persons");
            if (pCont) {
              // Update adults
              const formAdultsText = pCont.querySelector(
                '[data-counter*="adults"]'
              );
              if (formAdultsText) {
                const valA = tCount("adults", formAdultsCount);
                if (formAdultsText.value !== undefined) {
                  formAdultsText.value = valA;
                } else {
                  formAdultsText.textContent = valA;
                }

                // Update adults minus button state
                const aWrap = formAdultsText.closest(
                  ".form_picker-persons-wrapper"
                );
                if (aWrap) {
                  const minusBtn = aWrap.querySelector(
                    '[data-controls="minus"]'
                  );
                  if (minusBtn) {
                    if (formAdultsCount === 1) {
                      minusBtn.classList.add("is-disabled");
                    } else {
                      minusBtn.classList.remove("is-disabled");
                    }
                  }
                }
              }

              // Update children (only if children elements exist)
              const formChildsText = pCont.querySelector(
                '[data-counter*="child"]'
              );
              if (formChildsText) {
                const valC = tCount("children", formChildrenCount);
                if (formChildsText.value !== undefined) {
                  formChildsText.value = valC;
                } else {
                  formChildsText.textContent = valC;
                }

                // Update children minus button state
                const cWrap = formChildsText.closest(
                  ".form_picker-persons-wrapper"
                );
                if (cWrap) {
                  const minusBtn = cWrap.querySelector(
                    '[data-controls="minus"]'
                  );
                  if (minusBtn) {
                    if (formChildrenCount === 0) {
                      minusBtn.classList.add("is-disabled");
                    } else {
                      minusBtn.classList.remove("is-disabled");
                    }
                  }

                  // Update children-specific functionality
                  updateChildPlusMinusState(cWrap, formChildrenCount);
                }
              }
            }

            // Update nights display and child age items
            updateNightsDisplay(heroSelectedDates);
            updateChildAgeItems(formChildrenCount);
          }
        });
      }
    }, 600);
  }

  const formDateEl = document.querySelector(
    '.form_picker-date[data-picker="date-text-form"]'
  );
  const formDateHiddenEl = document.querySelector(
    '[data-picker="date-hidden-form"]'
  );
  if (formDateEl) {
    const flatpickrConfig = {
      mode: "range",
      dateFormat: "D., d. M.",
      minDate: "today",
      locale: resolveFlatpickrLocale(),
      static: true,
      position: "below",
      onReady: function (sel, ds, inst) {
        const cal = inst.calendarContainer;
        if (cal) {
          cal.classList.add("form_picker_initial-position");
          const extraFields = cal.querySelectorAll("input[name^='field']");
          extraFields.forEach((f) => f.removeAttribute("name"));
        }
      },
      onChange: function (sel, ds, inst) {
        if (!sel || sel.length === 0) {
          formDateEl.value = "";
        } else {
          formDateEl.value = formatFancyRange(sel, inst);
        }
        if (formDateHiddenEl) {
          formDateHiddenEl.value = formatTechnicalRange(sel);
        }
        updateNightsDisplay(sel);
      },
    };

    formDateInstance = flatpickr(formDateEl, {
      ...flatpickrConfig,
      showMonths: window.innerWidth >= 992 ? 2 : 1,
    });

    window.addEventListener(
      "resize",
      debounce(function () {
        if (!formDateInstance) return;

        const newShowMonths = window.innerWidth >= 992 ? 2 : 1;
        if (formDateInstance.config.showMonths === newShowMonths) return;

        const currentDates = formDateInstance.selectedDates;
        formDateInstance.destroy();

        formDateInstance = flatpickr(formDateEl, {
          ...flatpickrConfig,
          showMonths: newShowMonths,
        });

        if (currentDates?.length > 0) {
          formDateInstance.setDate(currentDates);
        }
      }, 250)
    );
  }

  function debounce(func, wait) {
    let timeout;
    return function () {
      const context = this,
        args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function () {
        func.apply(context, args);
      }, wait);
    };
  }

  (function initFormPersons() {
    const pCont = document.querySelector(".form_picker-persons");
    if (!pCont) return;

    // Find all person wrappers
    const allWrappers = pCont.querySelectorAll(".form_picker-persons-wrapper");
    if (allWrappers.length === 0) return;

    // Initialize adults functionality - always try to find it
    let aWrap = null;
    let formAdultsText = null;

    // Look for adults wrapper by finding the one with adults counter
    for (let wrapper of allWrappers) {
      const counterEl = wrapper.querySelector('[data-counter*="adults"]');
      if (counterEl) {
        aWrap = wrapper;
        formAdultsText = counterEl;
        break;
      }
    }

    // Initialize children functionality - only if present
    let cWrap = null;
    let formChildsText = null;

    // Look for children wrapper by finding the one with children/childs counter
    for (let wrapper of allWrappers) {
      const counterEl = wrapper.querySelector('[data-counter*="child"]');
      if (counterEl) {
        cWrap = wrapper;
        formChildsText = counterEl;
        break;
      }
    }

    // ADULTS FUNCTIONALITY - Always initialize if found
    if (aWrap && formAdultsText) {
      console.log("Initializing adults functionality");

      // Set initial adults text
      const valA = tCount("adults", formAdultsCount);
      if (formAdultsText.value !== undefined) {
        formAdultsText.value = valA;
      } else {
        formAdultsText.textContent = valA;
      }

      // Initialize adults controls
      const aCtrls = aWrap.querySelectorAll("[data-controls]");
      aCtrls.forEach(function (ctrl) {
        ctrl.addEventListener("click", function () {
          const action = ctrl.getAttribute("data-controls");

          if (action === "plus") {
            formAdultsCount++;
          } else if (action === "minus" && formAdultsCount > 1) {
            formAdultsCount--;
          }

          // Update adults display
          const newValA = tCount("adults", formAdultsCount);
          if (formAdultsText.value !== undefined) {
            formAdultsText.value = newValA;
          } else {
            formAdultsText.textContent = newValA;
          }

          // Update minus button state for adults
          const minusBtn = aWrap.querySelector('[data-controls="minus"]');
          if (minusBtn) {
            if (formAdultsCount === 1) {
              minusBtn.classList.add("is-disabled");
            } else {
              minusBtn.classList.remove("is-disabled");
            }
          }
        });
      });

      // Set initial minus button state for adults
      const initialMinusBtn = aWrap.querySelector('[data-controls="minus"]');
      if (initialMinusBtn) {
        if (formAdultsCount === 1) {
          initialMinusBtn.classList.add("is-disabled");
        } else {
          initialMinusBtn.classList.remove("is-disabled");
        }
      }
    } else {
      console.warn(
        "Adults form elements not found - adults functionality disabled"
      );
    }

    // CHILDREN FUNCTIONALITY - Only initialize if found
    if (cWrap && formChildsText) {
      console.log("Initializing children functionality");

      // Set initial children text
      const valC = tCount("children", formChildrenCount);
      if (formChildsText.value !== undefined) {
        formChildsText.value = valC;
      } else {
        formChildsText.textContent = valC;
      }

      // Initialize children controls
      const cCtrls = cWrap.querySelectorAll("[data-controls]");
      cCtrls.forEach(function (ctrl) {
        ctrl.addEventListener("click", function () {
          const action = ctrl.getAttribute("data-controls");

          if (action === "plus") {
            formChildrenCount++;
          } else if (action === "minus" && formChildrenCount > 0) {
            formChildrenCount--;
          }

          // Clamp children count based on available age fields
          formChildrenCount = clampChildrenCount(formChildrenCount);

          // Update children display
          const newValC = tCount("children", formChildrenCount);
          if (formChildsText.value !== undefined) {
            formChildsText.value = newValC;
          } else {
            formChildsText.textContent = newValC;
          }

          // Update minus button state for children
          const minusBtn = cWrap.querySelector('[data-controls="minus"]');
          if (minusBtn) {
            if (formChildrenCount === 0) {
              minusBtn.classList.add("is-disabled");
            } else {
              minusBtn.classList.remove("is-disabled");
            }
          }

          // Update child age fields
          updateChildAgeItems(formChildrenCount);

          // Update plus/minus states for children
          updateChildPlusMinusState(cWrap, formChildrenCount);
        });
      });

      // Set initial states for children
      setTimeout(() => {
        updateChildAgeItems(formChildrenCount);
        updateChildPlusMinusState(cWrap, clampChildrenCount(formChildrenCount));
      }, 0);
    } else {
      console.warn(
        "Children form elements not found - children functionality disabled"
      );
      // Force children count to 0 if no children elements found
      formChildrenCount = 0;
    }
  })();

  // Webflow form interception - must run after Webflow initializes
  (function customValidationSetup() {
    window.Webflow ||= [];
    window.Webflow.push(() => {
      // Detect form type: Custom Worker or Form Taxi
      const workerForm = document.querySelector("form[data-hotel-code], form[data-hotel-id]");
      const taxiForm = document.querySelector("form[data-form-taxi-url]");

      // Determine which form system to use
      let myForm = null;
      let formType = null;

      if (workerForm && !workerForm.hasAttribute('data-form-taxi-url')) {
        myForm = workerForm;
        formType = 'worker';
      } else if (taxiForm && !taxiForm.hasAttribute('data-hotel-code') && !taxiForm.hasAttribute('data-hotel-id')) {
        myForm = taxiForm;
        formType = 'taxi';
      } else if (workerForm && workerForm.hasAttribute('data-form-taxi-url')) {
        // Form has both - prefer Worker (data-hotel-code takes precedence)
        myForm = workerForm;
        formType = 'worker';
        console.warn("⚠️ Form has both data-hotel-code and data-form-taxi-url. Using Worker backend.");
      } else {
        console.log("ℹ️ No booking form found on this page.");
        return;
      }

      console.log(`🔧 Initializing ${formType === 'worker' ? 'Custom Worker' : 'Form Taxi'} form handler...`);

      function showElement(el, displayType = "block") {
        el.style.display = displayType;
        el.style.visibility = "visible";
      }
      function hideElement(el) {
        el.style.display = "none";
        el.style.visibility = "hidden";
      }
      function validateRequiredFields(showErrors = false) {
        let isFormValid = true;
        let firstErrorElement = null;
        document.querySelectorAll("[data-required]").forEach((requiredGroup) => {
          const inputs = requiredGroup.querySelectorAll(
            "input, select, textarea"
          );
          let isGroupValid = true;
          inputs.forEach((input) => {
            if (input.type === "checkbox" || input.type === "radio") {
            } else {
              if (input.value.trim() === "") {
                isGroupValid = false;
              }
            }
          });
          const checkable = Array.from(inputs).filter(
            (input) => input.type === "checkbox" || input.type === "radio"
          );
          if (checkable.length > 0) {
            if (!checkable.some((input) => input.checked)) {
              isGroupValid = false;
            }
          }
          const errorElement = requiredGroup.querySelector(".form_error");
          if (!isGroupValid) {
            isFormValid = false;
            if (showErrors && errorElement) {
              showElement(errorElement, "block");
              errorElement.setAttribute("aria-live", "polite");
            }
            if (!firstErrorElement) firstErrorElement = errorElement;
          } else {
            if (errorElement) {
              hideElement(errorElement);
              errorElement.removeAttribute("aria-live");
            }
          }
        });
        return { isFormValid, firstErrorElement };
      }

      // Configuration based on form type
      let submitEndpoint = null;
      const thankYouURL = window.location.origin + "/danke";

      if (formType === 'worker') {
        // Custom Worker configuration
        const workerUrl = myForm.dataset.workerUrl || "https://hotel-booking-worker.webflowxmemberstack.workers.dev";
        const hotelCode = myForm.dataset.hotelCode || myForm.dataset.hotelId;

        if (!hotelCode) {
          console.error("⚠️ data-hotel-code (or data-hotel-id) missing on <form>!");
          const errorEl = document.createElement("div");
          errorEl.className = "form_error form-config-error";
          errorEl.textContent =
            "Dieses Formular ist nicht richtig konfiguriert. Bitte kontaktieren Sie den Betreiber.";
          myForm.parentNode.insertBefore(errorEl, myForm);
          myForm.style.display = "none";
          return;
        }

        submitEndpoint = `${workerUrl}/submit/${hotelCode}`;
      } else {
        // Form Taxi configuration
        const taxiUrl = myForm.dataset.formTaxiUrl;

        if (!taxiUrl) {
          console.error("⚠️ data-form-taxi-url missing on <form>!");
          const errorEl = document.createElement("div");
          errorEl.className = "form_error form-config-error";
          errorEl.textContent =
            "Dieses Formular ist nicht richtig konfiguriert. Bitte kontaktieren Sie den Betreiber.";
          myForm.parentNode.insertBefore(errorEl, myForm);
          myForm.style.display = "none";
          return;
        }

        submitEndpoint = taxiUrl;
        myForm.action = taxiUrl;
      }

      // Get Webflow success/fail elements
      const doneElement = myForm.querySelector(".w-form-done");
      const failElement = myForm.querySelector(".w-form-fail");

      // Detach Webflow's default AJAX submission handler
      try {
        if (window.Webflow && window.Webflow.require) {
          const webflowForms = window.Webflow.require("forms");
          if (webflowForms && webflowForms.submit) {
            myForm.removeEventListener("submit", webflowForms.submit);
            console.log("✓ Detached Webflow form handler");
          }
        }
      } catch (error) {
        console.warn("Could not detach Webflow handler:", error);
      }

      // Add our custom submit handler
      myForm.addEventListener("submit", function (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        console.log("📝 Form submit intercepted");

        const { isFormValid, firstErrorElement } = validateRequiredFields(true);
        if (!isFormValid) {
          if (firstErrorElement) {
            firstErrorElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
          return;
        }

        const submitButton = myForm.querySelector(
          'button[type="submit"], input[type="submit"]'
        );
        let originalText = "";
        if (submitButton) {
          originalText = submitButton.textContent || submitButton.value;
          submitButton.disabled = true;
          if (submitButton.textContent !== undefined) {
            submitButton.textContent = "Bitte warten...";
          } else {
            submitButton.value = "Bitte warten...";
          }
        }

        // Convert FormData to JSON and normalize to English
        const formData = new FormData(myForm);
        const rawData = {};

        // First collect all raw form data
        for (const [key, value] of formData.entries()) {
          rawData[key] = value;
        }

        console.log("=== RAW FORM DATA (before transformation) ===");
        console.log(rawData);
        console.log("============================================");

        // Helper function to extract numbers from German/English text
        function extractNumber(text) {
          if (!text) return 0;
          const match = text.toString().match(/\d+/);
          return match ? parseInt(match[0], 10) : 0;
        }

        // Helper function to extract child age number
        function extractChildAge(text) {
          if (!text) return null;
          const match = text.toString().match(/\d+/);
          return match ? parseInt(match[0], 10) : null;
        }

        // Normalize gender/salutation
        function normalizeGender(anrede) {
          const value = (anrede || "").toLowerCase().trim();

          // Check if it's "not specified" in any language
          if (isNotSpecified(value)) {
            return "";
          }

          if (value.includes("frau") || value.includes("ms") || value.includes("mrs")) {
            return "Female";
          }
          if (value.includes("herr") || value.includes("mr")) {
            return "Male";
          }
          return ""; // default to empty instead of Male
        }

        // Check if value is "not specified" in any language
        function isNotSpecified(value) {
          if (!value) return true;
          const normalized = value.toLowerCase().trim();
          return (
            normalized === "" ||
            normalized === "keine angabe" ||
            normalized === "not specified" ||
            normalized === "na" ||
            normalized === "n/a"
          );
        }

        // Transform to English with normalized values
        const jsonData = {
          // Language (keep as is or detect from page)
          language: rawData.Sprache || rawData.language || "de",

          // Date period (already in ISO format from hidden field)
          period: rawData.period || "",

          // Guest counts - extract numbers from German text
          adults: extractNumber(rawData.Erwachsene || rawData.adults || "2"),
          children: extractNumber(rawData.Kinder || rawData.children || "0"),

          // Child ages - extract numbers from German text
          childAge1: extractChildAge(rawData["Alter-Kind-1"]),
          childAge2: extractChildAge(rawData["Alter-Kind-2"]),
          childAge3: extractChildAge(rawData["Alter-Kind-3"]),
          childAge4: extractChildAge(rawData["Alter-Kind-4"]),
          childAge5: extractChildAge(rawData["Alter-Kind-5"]),

          // Room selection (empty if "Keine Angabe" / "Not Specified")
          selectedRoom: isNotSpecified(rawData["selected-room"]) ? "" : rawData["selected-room"],
          selectedOffer: isNotSpecified(rawData["selected-offer"]) ? "" : rawData["selected-offer"],

          // Guest details
          salutation: normalizeGender(rawData.Anrede || rawData.salutation),
          firstName: rawData.Vorname || rawData.firstName || "",
          lastName: rawData.Nachname || rawData.lastName || "",
          phone: rawData.Telefonnummer || rawData.phone || "",
          email: rawData["E-Mail-Adresse"] || rawData.email || "",

          // Comments/notes
          comments: rawData.Anmerkung || rawData.comments || "",

          // Privacy consent
          privacyConsent: rawData.Privacy === "on" || rawData.privacyConsent === "on",

          // Traffic origin (page URL)
          origin: rawData["traffic-origin"] || ""
        };

        // Remove null child ages to keep payload clean
        if (jsonData.childAge1 === null) delete jsonData.childAge1;
        if (jsonData.childAge2 === null) delete jsonData.childAge2;
        if (jsonData.childAge3 === null) delete jsonData.childAge3;
        if (jsonData.childAge4 === null) delete jsonData.childAge4;
        if (jsonData.childAge5 === null) delete jsonData.childAge5;

        // Prepare fetch request based on form type
        let fetchOptions = {};

        if (formType === 'worker') {
          // Custom Worker: Send JSON
          console.log("=== BOOKING FORM SUBMISSION (Worker) ===");
          console.log("Endpoint:", submitEndpoint);
          console.log("Normalized Data:", jsonData);
          console.log("========================================");

          fetchOptions = {
            method: "POST",
            body: JSON.stringify(jsonData),
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          };
        } else {
          // Form Taxi: Send FormData
          console.log("=== BOOKING FORM SUBMISSION (Form Taxi) ===");
          console.log("Endpoint:", submitEndpoint);
          console.log("FormData:", rawData);
          console.log("===========================================");

          fetchOptions = {
            method: myForm.method || "POST",
            body: formData, // Send raw FormData for Form Taxi
            headers: {
              Accept: "application/json",
            },
          };
        }

        fetch(submitEndpoint, fetchOptions)
          .then((response) => {
            console.log("Response Status:", response.status, response.statusText);
            if (response.ok) {
              if (formType === 'taxi') {
                // Form Taxi: Just redirect on success
                return { success: true };
              } else {
                // Custom Worker: Parse JSON response
                return response.json();
              }
            } else {
              if (formType === 'worker') {
                return response
                  .json()
                  .then((errorData) => {
                    console.error("Server Error Response:", errorData);
                    throw new Error(
                      errorData.message || "Fehler beim Absenden des Formulars."
                    );
                  })
                  .catch((parseError) => {
                    console.error("Failed to parse error response:", parseError);
                    throw new Error("Fehler beim Absenden des Formulars.");
                  });
              } else {
                throw new Error("Fehler beim Absenden des Formulars.");
              }
            }
          })
          .then((data) => {
            if (formType === 'worker') {
              console.log("=== BOOKING SUCCESS (Worker) ===");
              console.log("Success Response:", data);
              console.log("Request ID:", data.requestId);
              console.log("================================");
            } else {
              console.log("=== BOOKING SUCCESS (Form Taxi) ===");
              console.log("====================================");
            }

            // Show Webflow success message if available
            if (doneElement) {
              doneElement.style.display = "block";
            }
            if (failElement) {
              failElement.style.display = "none";
            }

            // Redirect after a short delay
            setTimeout(() => {
              window.location.href = thankYouURL;
            }, 500);
          })
          .catch((error) => {
            console.error("=== BOOKING ERROR ===");
            console.error("Error:", error);
            console.error("====================");

            // Show Webflow fail message if available
            if (failElement) {
              failElement.style.display = "block";
            }
            if (doneElement) {
              doneElement.style.display = "none";
            }

            const errorMessage = myForm.querySelector(".form_error-message");
            if (errorMessage) {
              showElement(errorMessage, "block");
            }
            if (submitButton) {
              submitButton.disabled = false;
              if (submitButton.textContent !== undefined) {
                submitButton.textContent = originalText;
              } else {
                submitButton.value = originalText;
              }
            }
          });
      });

      document.querySelectorAll("[data-required]").forEach((requiredGroup) => {
        const inputs = requiredGroup.querySelectorAll("input, select, textarea");
        inputs.forEach((input) => {
          input.addEventListener("change", () => {
            let isValidNow = true;
            if (input.type === "checkbox" || input.type === "radio") {
              const checkable = Array.from(
                requiredGroup.querySelectorAll(
                  "input[type='checkbox'], input[type='radio']"
                )
              );
              if (!checkable.some((inp) => inp.checked)) {
                isValidNow = false;
              }
            } else {
              if (input.value.trim() === "") {
                isValidNow = false;
              }
            }
            if (isValidNow) {
              const errorElement = requiredGroup.querySelector(".form_error");
              if (errorElement) hideElement(errorElement);
            }
          });
        });
      });

      console.log("✅ Custom form handler initialized");
    });
  })();
});
