'use strict';

const local_currency=$('form#options input[name="local_currency"]').val(); // ILS is local currency
const curr_currency=$('body').data('currency_id');

let suppliers;
$.getJSON('/apps/jay-z/jz-suppliers.php', {}).done(function(response) {
	suppliers=response;
});

getUserData('comax_customer_group_id, default_comax_price_list_id, products_pricelists, products_categories, allow_true_stock, allow_price_control, allow_export, min_cart_total_limit');

function initContent() {
	let ajax, columns, dom, opts, colVisibility;
	
	colVisibility={
			'bts': true,
			'qty': true,
			'subtotal': true,
			'on_sale': true,
			'last_price': true
		};
		
	if (lang_code==="he") {
		colVisibility.product_name=true;
		colVisibility.product_name_en=false;
	} else {
		colVisibility.product_name=false;
		colVisibility.product_name_en=true;
	}
	
	if (role_group==="superuser") {
		colVisibility.bts=false;
		colVisibility.qty=false;
		colVisibility.subtotal=false;
		colVisibility.on_sale=false;
		colVisibility.last_price=false;
	}
	
	if ($('body').hasClass('ws-order')) {
		let child_row_control="tr";
		
		if (role_group==="superuser" || role_group==="wholesale_agent" || role_group==="chains_agent") {
			child_row_control=6;
		}
		
		const options_priority={
			'lots': tiny_purge(lang.wholesale_js_priority_label_option_lots),
			'maybe': tiny_purge(lang.wholesale_js_priority_label_option_maybe),
			'meh': tiny_purge(lang.wholesale_js_priority_label_option_meh),
			'nope': tiny_purge(lang.wholesale_js_priority_label_option_nope)
		};
		
		const options_pricing_rules={
			'0.13': tiny_purge(lang.wholesale_js_pricing_rule_label_option_013),
			'0.10': tiny_purge(lang.wholesale_js_pricing_rule_label_option_010),
			'0.11': tiny_purge(lang.wholesale_js_pricing_rule_label_option_011),
			'0.14': tiny_purge(lang.wholesale_js_pricing_rule_label_option_014),
			'0.12': tiny_purge(lang.wholesale_js_pricing_rule_label_option_012),
			'0.15': tiny_purge(lang.wholesale_js_pricing_rule_label_option_015),
			'1.00': tiny_purge(lang.mj_fox_edit_form_valid)
		};
		
		const four_days_ago = moment().subtract(4, 'days');
		
		dt=$('#order');
		const timezzHappened=[];
		
		const colIndex={
			'product_name': 6,
			'stock': 11,
			'price': 12
		};
		
		columns=[
			{
				'data': "cart_status",
				'visible': false
			},
			{
				'name': "new_arrival",
				'data': "new_arrival",
				'render': function(data, type, row) {
					if (type==='filter') {
						if (data) {
							return 'on';
						} else {
							return 'off';
						}
					}
					return data;
				},
				'visible': false
			},
			{
				'data': "on_bundle",
				'visible': false
			},
			{
				'name': "bts",
				'data': "bts",
				'className': "bts",
				'render': function(data, type, row) {
					if (type==='display') {
						if (data) {
							const theme = (row.new_arrival) ? 'new-arrival' : 'bts';
							return (role_group !== "wholesale") ?
								moment(data).format('DD/MM/YYYY') :
								'<i class="fa-solid fa-star ' + theme + ' " title="' + moment(data).format('DD/MM/YYYY (HH:mm)') + '"></i>';
						}
					}
					
					if (type==='filter') return (data) ? 'on' : 'off';
					return data;
				},
				'visible': colVisibility.bts
			},
			{
				'name': "category",
				'data': "category",
			},
			{
				'data': "img",
				'render': generateProductThumbnail,
				'searchable': false
			},
			{
				'name': "product_name",
				'data': "product_name",
				'className': "product_name",
				'render': formatProductName,
				'visible': colVisibility.product_name,
			},
			{
				'name': "product_name_en",
				'data': "product_name_en",
				'render': formatProductName,
				'visible': colVisibility.product_name_en
			},
			{
				'name': "brand",
				'data': "brand"
			},
			{
				'data': "brand_en",
				'visible': false
			},
			{
				'data': "sku",
				'render': function(data, type, row) {
					if (type==='display') {
						if (data.startsWith('724') && row.comax_department_id==200) {
							return '<i class="fa-solid fa-lock red ms-2 d-inline"></i>' + data;
						}
						
						if (role_group==="superuser") {
							return (row.jay_z.supplier_id > 0) ?
								'<a class="link-dark text-decoration-none" href="/apps/jay-z/jz-listings.php?sku=' + data + '" data-lightbox data-type="iframe" role="button"><i class="fa-solid fa-microphone-lines ms-2 d-inline jz-golden"></i></a>' + data :
								data;
						}
						
						if (role_group==="wholesale_agent" || role_group==="chains_agent") {
							return '<a class="link-dark" href="javascript:void(0);" onclick="javascript:generateBarcode(\''+data+'\')" "role="button" data-sku="'+data+'">'+data+'</a>';
						}
						
						return data;
					}
					return data;
				}
				
			},
			{
				'data': "stock",
				'render': function(data, type, row) {
					if (type==='display') {
						let data_uf=$.fn.dataTable.render.number(',', '.').display(data);
						
						// since we've already limited the stock behind the scenes, we can check if we've reached the limit and then add the plus sign
						if (role_group!=="superuser") {
							if (user_data.allow_true_stock) {
								// 1=limited, 2=full
								if (user_data.allow_true_stock==1 && data==max_visible_true_stock_allowed) {
									return data_uf + '+';
								}
							} else if (data==max_visible_stock) {
								return data_uf + '+';
							}
						}
						return data_uf;
					}
					return data;
				}
			},
			{
				'data': "price",
				'className': "price",
				'render': function(data, type, row) {
					if (type==='display') {
						let ret = '';
						if (row.on_sale) {
							ret += '<span class="ms-1 fw-semibold">' + formatPrice(data, currency_symbol) + '</span>' +
							'<span class="text-body-secondary">' + currency_symbol + '<s>' + formatPrice(row.original_price) + '</s></span>';
						} else {
							if (role_group==="superuser" && row.price_changelog.full_name.length) {
								if (row.price_changelog.text != row.price) {
									let direction="up";
									if (row.price_changelog.text > row.price) direction="down";
									ret += '<a class="btn-tooltip me-1" href="javascript:void(0);" data-bs-toggle="tooltip" data-bs-title="<i class=\'fa-solid fa-coin me-1\'></i>' + formatPrice(row.price_changelog.text, currency_symbol) + '<br><i class=\'fa-solid fa-user me-1\'></i><b>' + row.price_changelog.full_name + '</b><br><i class=\'fa-regular fa-calendar-clock me-1\'></i>' + moment(row.price_changelog.dt).format('DD/MM/YYYY (HH:mm)') + '" role="button"><i class="fa-regular fa-arrow-' + direction + ' fa-sm"></i></a>';
								}
							}
							ret += formatPrice(data, currency_symbol);
						}
						return ret;
					}
					return data;
				},
				'searchable': false,
				'width': colWidth.small
			},
			{
				'data': "qty",
				'className': "qty",
				'render': function(data, type, row) {
					return (type==='display') ?
						'<div class="input-group input-group-sm">' +
							'<button type="button" class="btn btn-outline-secondary btn-decrement">&minus;</button>' +
							'<input type="text" class="form-control" name="qty_' + row.id + '" value="' + data + '" min="0" max="' + set_available_qty(row.stock) + '" onclick="javascript:this.setSelectionRange(0, this.value.length)">' +
							'<button type="button" class="btn btn-outline-secondary btn-increment">&plus;</button>' +
						'</div>' :
						data;
				},
				'visible': colVisibility.qty,
				'orderable': false,
				'searchable': false,
				'width': colWidth.small
			},
			{
				'data': "subtotal",
				'className': "subtotal",
				'render': function(data, type, row) {
					return (type==='display') ?
						'<input type="text" class="form-control form-control-sm" name="subtotal_'+row.id+'" value="' + formatPrice(data) +'" readonly>' :
						data;
				},
				'visible': colVisibility.subtotal,
				'orderable': false,
				'searchable': false,
				'width': colWidth.medium
			},
			{
				'name': "on_sale",
				'data': "on_sale",
				'className': "on_sale",
				'render': function(data, type, row) {
					if (type==='display') {
						if (data) {
							return '<div class="timer timer-' + row.id + '" data-expiration="' + data + '">' +
								'<div class="clock"><img src="/img/apps/clock.png" alt="' + lang.wholesale_order_thead_on_sale + '"></div>' +
								'<div class="timer-unit"><div data-hours></div>' + lang.wholesale_js_on_sale_countdown_hours + '</div>' +
								'<div class="timer-unit"><div data-minutes></div>' + lang.wholesale_js_on_sale_countdown_minutes + '</div>' +
								'<div class="timer-unit ms-2"><div data-seconds></div>' + lang.wholesale_js_on_sale_countdown_seconds + '</div>' +
							'</div>';
						}
					}
					if (type==='filter') {
						if (data) {
							return 'on';
						} else {
							return 'off';
						}
					}
					return data;
				},
				'visible': colVisibility.on_sale
			},
			{
				'name': "official_importer",
				'defaultContent': "",
				'render': function(data, type, row) {
					if ( dt.data('official_brands').includes(row.brand_en) ) return 'on';
					return 'off';
				},
				'visible': false
			},
			{
				'name': "price_drop",
				'defaultContent': "",
				'render': function(data, type, row) {
					if (row.price_changelog.full_name.length) {
						const dt = moment(row.price_changelog.dt, 'YYYY-MM-DD HH:mm:ss');
						if ( row.price_changelog.text > row.price && dt.isAfter(four_days_ago) ) return 'on';
					}
					return 'off';
				},
				'visible': false
			},
			{
				'defaultContent': "",
				'className': "control",
				'orderable': false,
				'visible': false
			}
		];
		
		if (role_group == "superuser" || role_group == "wholesale_agent" || role_group == "chains_agent") {
			let extra_columns=[];
			
			if (role_group == "superuser") {
				if (user_data.allow_price_control) {
					columns[colIndex.price].render=function(data, type, row) {
						return renderPriceControlComponent(data, type, row, 'price', 'local_currency', true);
					}
				}
				
				columns[colIndex.stock]['orderSequence']=[ 'desc', 'asc' ];
				columns[colIndex.stock].render=function(data, type, row) {
					return (type==='display') ?
						'<a class="btn btn-dark btn-sm" href="ws-catalog-items-location.php?sku=' + row.sku + '" data-lightbox data-type="iframe" role="button">' + $.fn.dataTable.render.number(',', '.').display(data) + '</a>' :
						data;
				}
				
				extra_columns.push(
					{
						'data': "suppliers_orders",
						'render': function(data, type, row) {
							return (type==='display') ?
								'<a class="btn btn-dark btn-sm" href="ws-catalog-items-orders-by-suppliers.php?sku=' + row.sku + '" data-lightbox data-type="iframe" role="button">' + $.fn.dataTable.render.number(',', '.').display(data) + '</a>' :
								data;
						}
					},
					{
						'data': "customers_orders",
						'render': function(data, type, row) {
							return (type==='display') ?
								'<a class="btn btn-dark btn-sm" href="ws-catalog-items-orders-by-customers.php?sku=' + row.sku + '" data-lightbox data-type="iframe" role="button">' + $.fn.dataTable.render.number(',', '.').display(data) + '</a>' :
								data;
						}
					},
					{
						'data': "cost_price",
						'render': $.fn.dataTable.render.number(',', '.', 0, currency_symbol)
					},
					{
						'data': "zagranitsa_price",
						'className': "zagranitsa_price",
						'render': function(data, type, row) {
							return renderPriceControlComponent(data, type, row, 'zagranitsa_price', 'base_currency', user_data.allow_price_control);
						},
						'width': colWidth.small
					},
					{
						'data': "supplier_price",
						'render': function(data, type, row) {
							return $.fn.dataTable.render.number(',', '.', 2, row.supplier_currency_symbol).display(data)
						}
					},
					{
						'data': "supplier_price_usd",
						'render': function(data, type, row) {
							return $.fn.dataTable.render.number(',', '.', 2, '&#36;').display(data)
						},
						'visible': false
					},
					{
						'name': "supplier_price_by_order",
						'defaultContent': "",
						'visible': false
					},
					{
						'data': "jay_z",
						'render': function(data, type, row) {
							let ret;
							const sup_curr = suppliers[ data.supplier_id ]?.currency_symbol ?? currency_symbol;
							
							if (data.price<1) {
								ret=lang.missing_data;
							} else {
								ret=$.fn.dataTable.render.number(',', '.', 2, sup_curr).display(data.price);
							}
							
							if (type==='display') {
								let str='';
								let comparison='';
								
								if (row.zagranitsa_price>0 && data.price>0) {
									let dir='caret-down';
									let bgcolor="bg-success";
									let diff=Math.abs(data.price-row.zagranitsa_price);
									
									if (Math.round(diff)===0) {
										dir='equals';
										bgcolor="bg-light text-dark border border-dark";
									} else if (data.price<row.zagranitsa_price) {
										dir='caret-up';
										bgcolor="bg-danger";
									}
									
									comparison = '<span class="badge ' + bgcolor + ' me-2"><i class="fa-solid fa-' + dir + ' me-1"></i>' + $.fn.dataTable.render.number(',', '.', 0, sup_curr).display(diff) + '</span>';
								}
								
								if (data.price>0) {
									const sup_title = suppliers[ data.supplier_id ]?.title ?? data.supplier_id;
									
									str += '<a ';
									if (comparison.length<1) str += ' class="btn btn-link btn-tooltip fw-semibold py-0" ';
									str += 'href="javascript:void(0);" data-bs-toggle="tooltip" data-bs-title="<span dir=\'ltr\'>' + sup_title + '</span>" role="button">';
								}
								
								if (comparison.length) {
									str += comparison;
								} else {
									str += ret;
								}
								if (data.price>0) str += '</a>';
								if (comparison.length) str += ret;
								
								return str;
							}
							
							return ret;
						}
					},
					{
						'data': "quality",
						'render': quality_check
					},
					{
						'data': "profit_base_price",
						'class': "profit_base_price",
						'render': (data, type, row) => formatProfitPercentage(data, row.cost_price, type)
					},
					{
						'data': "profit_base_zagranitsa_price",
						'class': "profit_base_zagranitsa_price",
						'render': (data, type, row) => formatProfitPercentage(data, row.supplier_price_usd, type)
					},
					{
						'data': "suppliers_orders_searchable",
						'visible': false
					},
					{
						'data': "weight",
						'className': "weight",
						'render': function(data, type, row) {
							if (type==='display') {
								const timestamp = (data.dt) ? 'data-bs-toggle="tooltip" data-bs-title="' + moment(data.dt).format('DD/MM/YYYY (HH:mm)') + '"' : 'disabled';
								
								return '<div class="input-group input-group-sm">' +
										'<button type="button" class="btn btn-outline-secondary btn-save"><i class="fa-solid fa-save"></i></button>' +
										'<input type="text" class="form-control" id="weight-' + row.id + '" value="' + data.val + '" onclick="javascript:this.setSelectionRange(0, this.value.length)">' +
										'<button type="button" class="btn btn-outline-secondary btn-timestamp" ' + timestamp + '><i class=\"fa-solid fa-calendar\"></i></button>' +
									'</div>';
							}
							
							return data.val;
						},
						'width': colWidth.medium,
						'visible': false
					},
					{
						'name': "slim_shady_flagged",
						'data': "slim_shady_flagged",
						'className': "slim-shady-flagged",
						'render': function(data, type, row) {
							if (type==='display') {
								let checked='';
								if (data>0) checked="checked";
								return '<div class="form-switch"><input class="form-check-input" type="checkbox" name="slim_shady_flagged_' + row.id + '" id="slim_shady_flagged_' + row.id + '" value="1" ' + checked + '>';
							}
							
							if (type==='filter') {
								if (data) return 'on';
								return 'off';
							}
							
							return data;
						},
						'width': colWidth.small,
						'visible': false
					},
					{
						'data': "manufacturing_country",
						'render': fillBlanks,
						'width': colWidth.small,
						'visible': false
					},
					{
						'name': "pricing_rule",
						'data': "pricing_rule",
						'className': "pricing-rule",
						'render': function(data, type, row) {
							if (type==='display') {
								let html = '<select class="form-select form-select-sm" name="pricing_rule-' + row.id + '" aria-label="' + tiny_purge(lang.wholesale_order_thead_pricing_rule) + '">' +
									'<!--<option value="">' + lang.choose_option + '</option>-->';
									
									for ( const [key, label] of Object.entries(options_pricing_rules) ) {
										html += '<option value="' + key + '"';
										if (data == key) html += 'selected';
										html += '>' + label + '</option>';
									}
									
								html += '</select>';
								return html;
							}
							return data;
						},
						'visible': false,
						'width': colWidth.medium
					},
					{
						'name': "tester_suggestion",
						'data': "tester_suggestion",
						'render': (data, type, row) => (data) ? 'on' : 'off',
						'visible': false,
					},
					{
						'data': "bolero_gold_stock",
						'render': function(data, type, row) {
							return (type==='display') ?
								'<a class="btn-tooltip" href="javascript:void(0);" data-bs-toggle="tooltip" data-bs-title="<i class=\'fa-regular fa-calendar-clock me-1\'></i>' +  moment(data.last_updated_at).format('DD/MM/YYYY (HH:mm)') + '" role="button">' + $.fn.dataTable.render.number(',', '.').display(data.qty) + '</a>' :
								data.qty;
						},
						'searchable': false,
						'visible': false,
					}
				);
			}
			
			extra_columns.push(
				{
					'name': "bronze_tiger",
					'data': "bronze_tiger",
					'render': function(data, type, row) {
						let ret;
						
						if (data.price>0) {
							ret=$.fn.dataTable.render.number(',', '.', 2, currency_symbol).display(data.price);
						} else {
							ret=lang.missing_data;
						}
						
						if (type==='display' && data.price>0) {
							let dir='caret-down';
							let bgcolor="bg-success";
							let diff=Math.abs(data.price-row.price);
							
							if (Math.round(diff)===0) {
								dir='equals';
								bgcolor="bg-light text-dark border border-dark";
							} else if (data.price<row.price) {
								dir='caret-up';
								bgcolor="bg-danger";
							}
							
							ret='<span class="badge '+bgcolor+' me-2"><i class="fa-solid fa-'+dir+' me-1"></i>'+$.fn.dataTable.render.number(',', '.', 0, currency_symbol).display(diff)+'</span>'+data.stock;
						}
						
						return ret;
					},
					'visible': false
				},
				{
					'name': "ditto",
					'data': "ditto",
					'render': function(data, type, row) {
						/*if (type==='display') {
							if (data) {
								return '<i class="fa-solid fa-raindrops "></i>';
							}
						}*/
						if (type==='filter') {
							if (data) {
								return 'on';
							} else {
								return 'off';
							}
						}
						return data;
					},
					'visible': false
				},
				{
					'defaultContent': "",
					'className': "last-price",
					'orderable': false,
					'render': function(data, type, row) {
						return (type==='display') ?
							'<div class="input-group input-group-sm">' +
								//'<span class="input-group-text">' + currencies[ local_currency ].symbol + '</span>' +
								'<button type="button" class="btn btn-outline-secondary btn-retrieve" data-sku="' + row.sku + '"><i class=\"fa-solid fa-magnifying-glass-dollar\"></i></button>' +
								'<input type="text" class="form-control" id="last-price_' + row.id + '" readonly>' +
								'<button type="button" class="btn btn-outline-secondary btn-timestamp" disabled><i class=\"fa-solid fa-calendar\"></i></button>' +
							'</div>' :
							null;
					},
					'visible': colVisibility.last_price,
					'width': colWidth.large
				},
				{
					'name': "priority",
					'data': "priority",
					'className': "priority",
					'render': function(data, type, row) {
						if (type==='display') {
							let html = '<select class="form-select form-select-sm" name="priority-' + row.id + '" aria-label="' + tiny_purge(lang.wholesale_order_thead_priority) + '">' +
								'<option value="">' + lang.choose_option + '</option>';
								
								for ( const [key, label] of Object.entries(options_priority) ) {
									html += '<option value="' + key + '"';
									if (data == key) html += 'selected';
									html += '>' + label + '</option>';
								}
								
							html += '</select>';
							return html;
						}
						return data;
					},
					'visible': false,
					'width': colWidth.medium
				},
				{
					'defaultContent': "",
					'orderable': false,
					'render': function(data, type, row) {
						return (type==='display') ?
							'<a class="btn btn-light btn-sm btn-img" href="javascript:void(0);" onclick="javascript:fetchImageAndDownload(\''+row.img+'\', \''+row.sku+'\')" role="button" download="'+row.sku+'"><i class="fa-solid fa-download "></i></a>' :
							null;
					},
					'visible': false
				}
			);
			
			for (let i=0; i<extra_columns.length; i++) {
				columns.splice(colIndex.stock+i, 0, extra_columns[i]);
			}
		}
		
		if (role_group==="superuser" || role_group==="wholesale_agent" || role_group==="chains_agent") {
			dom = '<"#filters.row gy-3"';
			dom += '<"col-6 col-sm-auto"<"#customers">><"col-6 col-sm-auto"<"#brands">><"col-6 col-sm-auto"<"#categories">><"col-6 col-sm-auto"f>';
			if (user_data.selected_products_pricelists) dom += '<"col-6 col-sm-auto"<"#pricelists">>';
			if (role_group == "superuser") dom += '<"col-6 col-sm-auto"<"#pricing-rules">><"col-6 col-sm-auto"<"#toggle-tester_suggestion">>';
			dom += '<"col-6 col-sm-auto"<"#toggle-bts">><"col-6 col-sm-auto"<"#toggle-on_sale">><"col-6 col-sm-auto"<"#toggle-official_importer">><"col-6 col-sm-auto"<"#toggle-price_drop">><"col-6 col-sm-auto"<"#toggle-ditto">>';
			dom += '<"col-auto"B>><"row"<"col-12"t>><"row"<"col-12 col-md-7"i><"col-12 col-md-5"p>>';
		} else {
			dom = '<"#filters.row gy-3"<"col-auto"<"#brands">><"col-auto"<"#categories">><"col-auto"f><"col-auto"<"#toggle-bts">><"col-auto"<"#toggle-on_sale">><"col-auto"<"#toggle-official_importer">><"col-6 col-sm-auto"<"#toggle-price_drop">><"col-auto"B>><"row"<"col-12"t>><"row"<"col-12 col-md-7"i><"col-12 col-md-5"p>>';
		}
		
		let order=[
			[ $('#brand_en').index() ]
		];
		
		if (lang_code==="he") {
			order=[
				[ 0, 'desc' ], // cart_status
				[ $('#order-on_sale').index(), 'desc' ],
				[ 3, 'desc' ], // bts
				[ $('#brand').index() ],
				[ $('#product_name').index() ]
			];
		}
		
		opts={
			'ajax': {
				'url': 'ws-catalog.php',
				'type': 'POST',
				'data': { 'comax_price_list_id': dt.data('comax_price_list_id') },
				'dataSrc': 'data'
			},
			'columns': columns,
			'order': order,
			'dom': dom,
			'buttons': [
				{
					'text': '<i class="fa-solid fa-rotate-right me-1"></i>' + lang.apps_js_reset_btn,
					'className': 'btn-sm',
					'action': function (e, dt, node, config) {
						resetDataTablesFilters(e, dt, node, config);
						if ( $('#customers').length ) reset_selected_customer();
						if ( $('#pricelists').length ) $('#pricelists__select').val(user_data.default_comax_price_list_id).trigger('change');
					}
				},
			],
			'createdRow': function (row, data, dataIndex) {
				$(row).attr({
					'data-id': data.id,
					'data-price': data.price,
					'data-base_price': data.original_price,
					'data-qty': data.qty,
					'data-subtotal': data.subtotal,
					'data-cart': data.cart_status
				});
			},
			'initComplete': function(settings, json) {
				tom_select_builder(this, 'brands', lang.wholesale_js_brands_select_label, 'brand', '', false, '', '', null);
				if (role_group != "wholesale") /*const ts_categories=*/tom_select_builder(this, 'categories', lang.wholesale_js_categories_select_label, 'category');
				
				let curr_comax_price_list_id=Cookies.get('curr_comax_price_list_id');
				
				if (curr_comax_price_list_id===undefined) {
					curr_comax_price_list_id=user_data.default_comax_price_list_id;
					Cookies.set('curr_comax_price_list_id', curr_comax_price_list_id, { 'expires': 1, 'secure': true, 'sameSite': 'Lax' });
				}
				
				if ($('#pricelists').length) {
					let html = '';
					html += '<label class="form-label dt-label">' + tiny_purge(lang.wholesale_js_pricelists_select_label) + ':</label>';
					html += '<select id="pricelists__select" class="form-select form-select-sm"></select>'
					$('#pricelists').html(html);
					
					const selected_products_pricelists=JSON.parse(user_data.selected_products_pricelists);
					const selectPricelists=$('#pricelists__select');
					
					let wholesale_price_list=$('form#options input[name="wholesale_price_list"]');
					let selected = (wholesale_price_list.val()==curr_comax_price_list_id) ? true : false;
					let newOption=new Option(wholesale_price_list.data('desc'), wholesale_price_list.val(), selected, selected);
					selectPricelists.append(newOption);
					
					Object.keys(selected_products_pricelists).forEach(k => {
						let selected = (k==curr_comax_price_list_id) ? true : false;
						let newOption=new Option(selected_products_pricelists[k], k, selected, selected);
						selectPricelists.append(newOption);
					});
					
					selectPricelists.on('change', function() {
						Cookies.set('curr_comax_price_list_id', $(this).val(), { 'expires': 1, 'secure': true, 'sameSite': 'Lax' });
						empty_shopping_cart();
					});
				}
				
				const checkbox_togglers = ['bts', 'on_sale', 'official_importer', 'price_drop', 'ditto', 'price_drop'];
				
				if ( $('#pricing-rules').length ) select_builder('pricing-rules', lang.wholesale_js_filters_pricing_rules_label, 'pricing_rule', options_pricing_rules);
				
				if ( $('#toggle-tester_suggestion').length ) {
					$('#toggle-tester_suggestion').html( checkbox_builder('tester_suggestion', lang.wholesale_order_thead_tester_suggestion) );
					checkbox_togglers.push('tester_suggestion');
				}
				
				//$('#toggle-new_arrival').html( checkbox_builder('new_arrival', lang.wholesale_order_thead_new_arrival) );
				$('#toggle-bts').html( checkbox_builder('bts', lang.wholesale_js_toggle_bts_checkbox) );
				$('#toggle-on_sale').html( checkbox_builder('on_sale', lang.wholesale_order_thead_on_sale_checkbox) );
				$('#toggle-official_importer').html( checkbox_builder('official_importer', lang.wholesale_order_thead_official_importer) );
				$('#toggle-price_drop').html( checkbox_builder( 'price_drop', tiny_purge(lang.wholesale_order_thead_price_drop) ) );
				$('#toggle-ditto').html( checkbox_builder('ditto', lang.wholesale_order_thead_ditto) );
				checkbox_toggler( checkbox_togglers );
				
				/*if (curr_comax_price_list_id==user_data.default_comax_price_list_id && user_data.default_products_category>0) {
					ts_categories.setValue(user_data.default_products_category);
				}*/
				
				if ($('#customers').length) {
					let html = '';
					html += '<div class="ui-select">';
					html += '<label class="form-label dt-label">' + tiny_purge(lang.wholesale_js_customers_select_label) + ':</label>';
					html += '<select id="customers__select" class="form-select form-select-sm"></select>';
					html += '</div>';
					$('#customers').html(html);
					
					const ts = tom_select_ajax_builder('#customers__select', '/api/customers-search.php', 'address', {
						plugins: ['remove_button']
					});
					
					ts.on('change', function() {
						const value = this.getValue();
						const item = this.options[value];
						if (!item) return;
						
						const { id = null, name = '', address = '', local_id = null } = item;
						const payload = { id, name, address, local_id };

						Cookies.set('customers_behalf', JSON.stringify(payload), {
							expires: 1,
							secure: true,
							sameSite: 'Lax'
						});
						
						reset_last_prices();
						getCustomersDebt(item.id);
					});
					
					ts.on('item_remove', function(value) {
						if (!this.getValue()) reset_selected_customer();
					});
					
					(function init_preselected_customer() {
						const cookie = Cookies.get('customers_behalf');
						if (cookie === undefined) return;
						const obj = JSON.parse(cookie);
						ts.addOption(obj);
						ts.setValue(obj.id, true);
						getCustomersDebt(obj.id);
					})();
					
					table.on('click', '.last-price button.btn-retrieve', function() {
						const _this=$(this);
						
						let row=_this.parents('tr');
						if ( row.hasClass('child') ) row=row.prev('tr');
						const d=table.row( row ).data();
						
						const customer_id = document.querySelector('#customers__select').tomselect.getValue();
						
						if (customer_id.length) {
							$.getJSON('/api/last-price.php', { 'customer_id': customer_id, 'sku': d.sku }, (response) => {
								_this.siblings('input').val(response.price);
								
								if (response.ts) {
									const btn = _this.siblings('button.btn-timestamp')[0];
									btn.disabled=false;
									btn.setAttribute( 'data-bs-title', moment(response.ts).format('DD/MM/YYYY') );
									
									let tooltip = bootstrap.Tooltip.getInstance(btn);
									
									if (!tooltip)
										tooltip = new bootstrap.Tooltip(btn, tooltipOptions);
								}
							});
						} else {
							bsToastGenerator('warning', 'fa-solid fa-exclamation-circle', lang.wholesale_js_missing_customer_notification);
						}
					});
				}
				
				if (dt.data('sku')) table.search(dt.data('sku')).draw();
				
				if (role_group==="superuser" || user_data.allow_export==true) {
					table.button().add(0, {
						'extend': 'excel',
						'title': '',
						'text': '<i class="fa-regular fa-file-excel me-1"></i>Excel',
						'className': 'btn-sm',
						'exportOptions': {
							'columns': ':not(.no-export):visible',
							'orthogonal': 'export',
							'format': {
								'body': function (data, row, column, node) {
									//check if type is input using jquery
									if ( $(node).children().is("div.input-group") ) {
										return $(node).find('input[type="text"]').val();
									} else if ( $(node).children().is("bdi") ) {
										return $(node).children().text();
									}
									return data;
								}
							}
						}
					});
				}
				
				if (role_group==="superuser") {
					table.button().add(1, {
						'extend': 'colvis',
						'columns': ':not(.no-vis)',
						'text': '<i class="fa-regular fa-eye-slash me-1"></i>'+lang.wholesale_js_secrecy_btn,
						'className': 'btn-sm'
					});
					
					table.button().add(2, {
						'extend': 'excel',
						'title': '',
						'text': '<i class="fa-regular fa-dollar-sign me-1"></i>Listing',
						'className': 'btn-sm',
						'exportOptions': {
							'columns': [
								'#sku',
								'#brand_en',
								'#product_name_en',
								'#stock',
								'#zagranitsa',
								'#origin'
							],
							'orthogonal': 'export',
							'format': {
								'header': (data, columnId, node) => $(node).data('header'),
								'body': (data, row, column, node) => (column == 3 && data>=max_visible_true_stock_allowed) ? max_visible_true_stock_allowed + '+' : data
							},
							'rows': (idx, data, node) => (data.stock > 0 && data.original_price > 0 && data.zagranitsa_price > 0) ? true : false
						},
						'filename': 'price-list_' + moment().format('YYYY-MM-DD'),
						'customizeData': function (data) {
							data.body.sort((row_a, row_b) => {
								const brand_a = (row_a[1] ?? '').toLowerCase();
								const brand_b = (row_b[1] ?? '').toLowerCase();

								if (brand_a < brand_b) return -1;
								if (brand_a > brand_b) return 1;

								let stock_a = row_a[3];
								let stock_b = row_b[3];

								// Only convert if not already a number
								if (typeof stock_a !== 'number') stock_a = Number(stock_a.replace(/\D/g, ''));
								if (typeof stock_b !== 'number') stock_b = Number(stock_b.replace(/\D/g, ''));

								return stock_b - stock_a; // descending order
							});
						}
					});
					
					table.button().add(3, {
						'extend': 'excel',
						'title': '',
						'text': '<i class="fa-regular fa-shekel-sign me-1"></i>Listing',
						'className': 'btn-sm',
						'exportOptions': {
							'columns': [
								'#sku',
								'#brand',
								'#product_name',
								'#stock',
								'#price'
							],
							'orthogonal': 'export',
							'format': {
								'body': (data, row, column, node) => (column == 3 && data>=max_visible_stock) ? max_visible_stock + '+' : data
							},
							'rows': (idx, data, node) => (data.stock > 0 && data.original_price > 0) ? true : false
						},
						'filename': 'מחירון_' + moment().format('DD-MM-YYYY')
					});
					
					bgUpdateTableColumn('products', 'id', 'id', 'slim_shady_flagged', '.slim-shady-flagged input[type="checkbox"]', 'change', 0, 'checkbox');
					bgUpdateTableColumn('products', 'id', 'id', 'priority', '.priority select');
					bgUpdateTableColumn('products', 'id', 'id', 'pricing_rule', '.pricing-rule select');
					
					table.on('search.dt', handleSuppliersOrdersPrices);
				}
				
				if (role_group==="wholesale_agent" || role_group==="chains_agent") {
					table.button().add(0, {
						'text': '<i class="fa-regular fa-eye-slash me-1"></i>'+lang.wholesale_js_secrecy_btn,
						'className': 'btn-sm',
						'action': function (e, dt, node, config) {
							e.preventDefault();
							const column = table.column('bronze_tiger:name');
							column.visible(!column.visible());
						}
					});
				}

				calc_shopping_cart(true);
			},
			'drawCallback': function(settings) {
				init_dt_ui_addons(dt[0], true);
				
				let timers=document.querySelectorAll('.timer');
				if (timers.length) {
					for (let i = 0; i < timers.length; i++) {
						let inst=timers[i].classList[ timers[i].classList.length-1 ];
						if (timezzHappened.includes(inst)===false) {
							timezz(timers[i], { 'date': timers[i].dataset.expiration, 'stopOnZero': true });
							timezzHappened.push(inst);
						}
					}
				}
			},
			'stateSave': true,
			'stateSaveParams': function (settings, data) {
				for (let i=0; i<data.columns.length; i++) {
					delete data.columns[i].search;
				}
			},
			'responsive': {
				'breakpoints': breakpoints,
				'details': {
					'type': 'column',
					'target': child_row_control
				}
			},
			'pageLength': 50,
			'lengthChange': false,
			'scrollToTop': true,
			'autoWidth': false
		};
		
		if (lang_code==="he") {
			opts.language={
				'url': "/assets/js/dataTables.he.json"
			};
		}
		
		table=dt.DataTable(opts);
		
		table.on( 'responsive-display', function (e, datatable, row, showHide, update) {
			let myRow=table.row( row );
			let expiration=myRow.data().on_sale;
			
			if (expiration && showHide) {
				let timers=document.querySelectorAll( '.timer-'+myRow.data().id );
				let timer=timezz(timers[timers.length - 1], { 'date': expiration, 'stopOnZero': true });
			}
		} );
		
		$('#checkout-btn').on('click', function() {
			let cart_content_count=Number( $('#cart-content-count').text().replace(/\,/g, '') );
			let cart_total=Number( $('#cart-total .price .amount').text().replace(/\,/g, '') );
			//let min_cart_total_limit=Number($('form#options input[name="min_cart_total_limit"]').val());
			
			if (cart_content_count<1) {
				bsAlertGenerator('warning', 'fa-solid fa-exclamation-circle', lang.wholesale_checkout_cart_empty);
			} else if (cart_total<1) {
				bsAlertGenerator('warning', 'fa-solid fa-exclamation-circle', lang.wholesale_js_min_cart_total_notification + ' ' + currency_symbol + '0.');
			} else if ((role_group==="superuser" || role_group==="wholesale_agent" || role_group==="chains_agent") && Cookies.get('customers_behalf')===undefined) {
				bsAlertGenerator('danger', 'fa-solid fa-exclamation-triangle', lang.wholesale_js_missing_customers_behalf_notification);
			} else {
				top.window.location.replace('ws-checkout.php');
			}
		});
		
		if ($('#last-update').length) {
			let ms_until_refresh=$('#last-update').data('refresh')*60000; // 1 minute=60,000 milliseconds
			if (ms_until_refresh>0) {
				delay(function(){
					bsAlertGenerator('info', 'fa-solid fa-info-circle', lang.wholesale_js_refresh_notification, false);
				}, ms_until_refresh);
			}
		}
		
		let populated_supplier_order_rows = [];
		
		function handleSuppliersOrdersPrices() {
			resetSuppliersOrdersPrices();
			
			const order_number = table.search().trim();
			
			if ( !/^216\d{4}$/.test(order_number) ) {
				return;
			}
			
			populateSuppliersOrdersPrices(order_number);
		}
		
		async function populateSuppliersOrdersPrices(order_number) {
			try {
				const metadata = await $.getJSON('/apps/mj-fox/mjf-get-metadata.php', {
					'order_number': order_number
				});

				if ( !metadata.order_date )
					return;

				const response = await $.getJSON('ws-catalog-items-orders-by-suppliers-query.php', {
					'order_number': order_number,
					'order_date': metadata.order_date
				});

				const prices_by_barcode = {};

				response.data.forEach(item => {
					if ( prices_by_barcode[ item.sku ] )
						return;

					prices_by_barcode[ item.sku ] = $.fn.dataTable.render.number(',', '.', 2, item.supplier_currency_symbol).display(item.price);
				});

				table.rows().every(function() {
					const d = this.data();

					if ( !prices_by_barcode[ d.sku ] )
						return;

					table.cell(this.index(), 'supplier_price_by_order:name').data(
						prices_by_barcode[ d.sku ]
					);

					populated_supplier_order_rows.push( this.index() );
				});
			} catch (err) {
				bsToastGenerator('danger', 'fa-solid fa-triangle-exclamation', lang.apps_js_error_occured);
			}
		}
		
		function resetSuppliersOrdersPrices() {
			populated_supplier_order_rows.forEach(row_index => {
				table.cell(row_index, 'supplier_price_by_order:name').data('');
			});

			populated_supplier_order_rows = [];
		}
	}
	
	if ($('body').hasClass('ws-checkout')) {
		dt=$('#checkout');
		
		const colIndex={
			'price': 5
		};
		
		columns=[
			{
				'data': "img",
				'render': generateProductThumbnail
			},
			{
				'data': "product_name",
				'visible': colVisibility.product_name,
				'className': "product_name",
				'render': function(data, type, row) {
					if (type==='display') {
						let ret=data;
						if (row.on_bundle) {
							let title=row.bundle_qty + '+' + lang.wholesale_js_free_gift;
							ret+='<span class="badge bg-danger ms-2" title="'+title+'"><i class="fa-solid fa-gift me-1"></i>'+title+'</span>';
						}
						return ret;
					}
					return data;
				}
			},
			{
				'data': "sku",
				'render': function(data, type, row) {
					if (type==='display') {
						if (data.startsWith('724') && row.comax_department_id==200) {
							return '<i class="fa-solid fa-lock red ms-2 d-inline"></i>' + data;
						}
						return data;
					}
					return data;
				}
				
			},
			{
				'data': "product_name_en",
				'visible': colVisibility.product_name_en
			},
			{
				'data': "brand_en",
				'visible': false
			},
			{
				'data': "price",
				'className': "price",
				'render': function(data, type, row) {
					return formatPrice(data, currency_symbol)
				},
				'searchable': false
			},
			{
				'data': "qty",
				'className': "qty",
				'render': function(data, type, row) {
					return ( (type==='display') && row.created_via==="checkout") ?
						'<div class="input-group input-group-sm">' +
							'<button type="button" class="btn btn-outline-secondary btn-decrement">&minus;</button>' +
							'<input type="text" class="form-control" name="qty_' + row.id + '" value="' + data + '" min="0" max="' + set_available_qty(row.stock) + '" onclick="javascript:this.setSelectionRange(0, this.value.length)">' +
							'<button type="button" class="btn btn-outline-secondary btn-increment">&plus;</button>' +
						'</div>' :
						data;
				},
				'width': colWidth.small
			},
			{
				'data': "subtotal",
				'className': "subtotal",
				'render': function(data, type, row) {
					return (type==='display') ?
						'<input type="text" class="form-control form-control-sm" name="subtotal_' + row.id + '" value="' + formatPrice(data) + '" readonly>' :
						data;
				},
				'width': colWidth.medium
			},
			{
				'defaultContent': "",
				'className': "trash",
				'render': function(data, type, row) {
					if (row.created_via==="checkout") {
						let bundle='';
						if (row.on_bundle) { bundle=' data-bundle="'+row.bundle_metadata.id+'"'; }
						return '<button type="button"'+bundle+' class="btn btn-dark btn-sm btn-trash"><i class="fa-regular fa-trash-can"></i></button>';
					}
				}
			},
			{
				'defaultContent': "",
				'className': "control",
				'visible': false
			}
		];
		
		if (role_group == "superuser" || role_group == "wholesale_agent" || role_group == "chains_agent") {
			let extra_columns=[];
			
			if ( (role_group == "superuser" || role_group == "chains_agent") && user_data.allow_price_control) {
				columns[colIndex.price].className="price";
				columns[colIndex.price].render=function(data, type, row) {
					return renderPriceControlComponent(data, type, row, 'price', currency_symbol, row.created_via == "checkout");
				}
				columns[colIndex.price].width=colWidth.large;
			}
			
			if (role_group == "superuser") {
				extra_columns.push(
					{
						'data': "gross_margin",
						'className': "gross_margin",
						'render': function(data, type, row) {
							if (role_group==="superuser") {
								let cost_price=row.cost_price;
								let gross_margin=calc_gross_margin( (row.subtotal/row.qty) , row.cost_price);
								let percentage=$.fn.dataTable.render.number(',', '.', 2, '', '%').display(gross_margin.percentage);
								
								return (type==='display') ?
									'<bdi class="'+gross_margin.text_color+'">'+percentage+'</bdi>' :
									percentage;
							}
							return data;
						}
					},
					{
						'data': "cost_price",
						'className': "cost_price",
						'render': $.fn.dataTable.render.number(',', '.', 2, currency_symbol)
					}
				);
			}
			
			if (role_group==="superuser" || role_group==="wholesale_agent") {
				extra_columns.push(
					{
						'data': "discount",
						'className': "discount",
						'render': function(data, type, row) {
							let btn_reset="btn-outline-secondary";
							if (row.discount>0) btn_reset="btn-warning";
							
							let limit=5;
							if (role_group==="superuser") limit=100;
							
							return ( (type==='display') && row.created_via==="checkout" ) ?
								'<div class="input-group input-group-sm">' +
									'<span class="input-group-text">%</span>' +
									'<input type="text" class="form-control" name="discount_' + row.id + '" value="' + formatPrice(row.discount) + '" min="0" max="' + limit + '" onclick="javascript:this.setSelectionRange(0, this.value.length)">' +
									'<button type="button" class="btn ' + btn_reset + ' btn-reset"><i class=\"fa-solid fa-times\"></i></button>' +
								'</div>' :
								$.fn.dataTable.render.number(',', '.', 0, '', '%').display(data);
						},
						'width': colWidth.medium
					}
				);
			}
			
			extra_columns.push(
				{
					'data': "free_qty",
					'className': "free_qty",
					'render': function(data, type, row) {
						return ( (type==='display') && row.created_via==="checkout" ) ?
							'<div class="input-group input-group-sm">' +
								'<button type="button" class="btn btn-outline-secondary btn-decrement">&minus;</button>' +
								'<input type="text" class="form-control" name="free_qty_' + row.id + '" value="' + row.free_qty + '" min="0" max="' + row.stock + '" onclick="javascript:this.setSelectionRange(0, this.value.length)">' +
								'<button type="button" class="btn btn-outline-secondary btn-increment">&plus;</button>' +
							'</div>' :
							data;
					},
					'width': colWidth.small
				}
			);
			
			for (let i=0; i<extra_columns.length; i++) {
				columns.splice(colIndex.price+i, 0, extra_columns[i]);
			}
			
			let customers_behalf=JSON.parse( Cookies.get('customers_behalf') );
			getCustomersDebt(customers_behalf.id);
		}
		
		opts={
			'ajax': {
				'url': 'ws-order-items.php',
				'dataSrc': 'data'
			},
			'columns': columns,
			'dom': '<"#filters.row gy-3"<"col-auto"B>><"row"<"col-12"t>><"row"<"col-12 col-md-7"i><"col-12 col-md-5"p>>',
			'buttons': [
				{
					'text': '<i class="fa-regular fa-trash-can me-1"></i>'+lang.wholesale_js_empty_cart_btn_text,
					'className': 'btn-sm',
					'action': function (e, dt, node, config) {
						empty_shopping_cart();
					},
					'attr': {
						'id': 'btn-empty-cart'
					}
				}
			],
			'createdRow': function (row, data, dataIndex) {
				$(row).attr({
					'data-id': data.id,
					'data-price': data.price,
					'data-qty': data.qty,
					'data-subtotal': data.subtotal,
					'data-cart': 'include',
					'data-cost_price': data.cost_price,
					'data-discount': data.discount,
					'data-free_qty': data.free_qty
				});
			},
			'initComplete': function(settings, json) {
				if (role_group==="superuser" || user_data.allow_export==true) {
					table.button().add(0, {
						'extend': 'excel',
						'title': '',
						'text': '<i class="fa-regular fa-file-excel me-1"></i>Excel',
						'className': 'btn-sm',
						'exportOptions': {
							'columns': ':not(.no-export):visible',
							'orthogonal': 'export',
							'format': {
								'body': function (data, row, column, node) {
									//check if type is input using jquery
									if ( $(node).children().is("div.input-group") ) {
										return $(node).find('input[type="text"]').val();
									} else if ( $(node).children().is("bdi") ) {
										return $(node).children().text();
									}
									return $(node).text();
								}
							}
						}
					});
				}
				
				calc_shopping_cart(false, true);
			},
			'drawCallback': function(settings) {
				init_dt_ui_addons(dt[0]);
			},
			'responsive': {
				'breakpoints': breakpoints,
				'details': {
					'type': "column",
					'target': 1
				}
			},
			'searching': false,
			'ordering': false,
			'paging': false,
			'autoWidth': false
		};
		
		if (lang_code==="he") {
			opts.language={
				'url': "/assets/js/dataTables.he.json"
			};
		}
		
		table=dt.DataTable(opts);
		
		table.on( 'responsive-display', function (e, datatable, row, showHide, update) {
			calc_shopping_cart(true);
		} );
		
		if (role_group==="superuser"|| role_group==="wholesale_agent") {
			const max = role_group == "superuser" ? 5 : 100;

			$('table.dt tbody').on('input', '.discount input', function() {
				const _this=$(this);
				const row_id=_this.prop('name').replace('discount_', '');
				const min=0;
				const btn_reset=_this.siblings('button.btn-reset');
				
				const original='btn-outline-secondary';
				const altered='btn-warning';
				
				let value=Number( _this.val() );
				value = isNaN(value) ? 0 : value;

				if (value < min) value=min;
				else if (value > max) value=max;

				if (value < 1) {
					if (btn_reset.hasClass(original) === false)
						btn_reset.removeClass(altered).addClass(original);
				} else {
					if (btn_reset.hasClass(altered) === false)
						btn_reset.removeClass(original).addClass(altered);
				}

				_this.val( parseInt(value) );
				calc_subtotal(row_id);
			});
			
			$('table.dt tbody').on('click', '.discount button.btn-reset', function() {
				let _this=$(this).siblings('input');				
				_this.val(0).trigger('input');
			});
			
			$('#cart-discount input').on('input', function() {
				const _this=$(this);
				const min=0;
				const btn_reset=_this.siblings('button.btn-reset');
				
				const original='btn-outline-secondary';
				const altered='btn-warning';
				
				let value=Number( _this.val() );
				value = isNaN(value) ? 0 : value;
				
				if (value < min) value=min;
				else if (value > max) value=max;
				
				if (value < 1) {
					if (btn_reset.hasClass(original) === false)
						btn_reset.removeClass(altered).addClass(original);
				} else {
					if (btn_reset.hasClass(altered) === false)
						btn_reset.removeClass(original).addClass(altered);
				}
				
				_this.val( parseInt(value) );
				calc_shopping_cart();
			});
			
			$('#cart-discount button.btn-reset').on('click', function() {
				let _this=$(this).siblings('input');				
				_this.val(0).trigger('input');
			});
			
			$('#order_status').on('change', function() {
				calc_shopping_cart();
			});
		}
		
		if ($('#shipping_method').length) {
			$('#shipping_method').on('change', function() {
				calc_shopping_cart();
			});
		}
		
		$('#order_notes, #order_details').on('blur', function() {
			calc_shopping_cart();
		});
		
		const form=$('#order-summary > form');
		
		form.on('submit', async function(e) {
			e.preventDefault();

			if ( !form.isValid() ) {
				e.stopPropagation();

				form.addClass('was-validated');

				return false;
			}

			form.removeClass('was-validated');

			const order_btn = $('#order-btn');
			const order_btn_html = order_btn.html();

			order_btn
				.html('<i class="fa-solid fa-spinner fa-spin me-1"></i>' + lang.wholesale_js_order_btn_loading)
				.prop('disabled', true);

			try {
				const response = await $.ajax({
					'url': 'ws-cart-validate.php',
					'type': 'POST',
					'dataType': 'json'
				});

				if ( response.success === true ) {
					top.window.location.replace('ws-comax.php');
					return true;
				}

				if ( response.errors && response.errors.length ) {
					response.errors.forEach(function(item) {
						let message = item.product_title + ' ' + tiny_purge(lang.wholesale_checkout_requested_quantity_unavailable) + ' (' + tiny_purge(lang.wholesale_checkout_requested) + ': ' + item.requested_qty + ', ' + tiny_purge(lang.wholesale_checkout_available) + ': ' + item.available_qty + ')';
						bsToastGenerator('warning', 'fa-solid fa-exclamation-circle', message);
					});
				}
			} catch (err) {
				bsToastGenerator('danger', 'fa-solid fa-triangle-exclamation', lang.apps_js_error_occured);
			}

			order_btn
				.html(order_btn_html)
				.prop('disabled', false);

			return false;
		});
		
		$('table.dt tbody').on('click', '.trash button.btn-trash', async function() {
			let row = $(this).parents('tr');
			if ( row.hasClass('child') ) row = row.prev('tr');

			const row_id = row.prop('id').replace('row_', '');

			$('table.dt tr#row_' + row_id).data({
				'qty': 0,
				'subtotal': 0,
				'free_qty': 0
			}).attr('data-cart', 'exclude');

			if ( $(this).data('bundle') ) {
				table.row( $('tr#row_' + $(this).data('bundle')) ).remove();
			}

			table.row(row).remove().draw();
			await calc_shopping_cart(false, true);

			if ( !table.data().count() ) $('#btn-empty-cart').trigger('click');
		});
	}
	
	if ( $('body').hasClass('ws-complete') ) {
		if (role_group==="superuser" || role_group==="wholesale_agent" || role_group==="chains_agent") {
			Cookies.remove('customers_behalf');
			Cookies.remove('order_params');
			if ($('#pricelists').length) Cookies.set('curr_comax_price_list_id', user_data.default_comax_price_list_id, { 'expires': 1, 'secure': true, 'sameSite': 'Lax' });
		}
	}
	
	if ( $('body').hasClass('ws-order') || $('body').hasClass('ws-checkout') ) {
		$('table.dt tbody').on('click', '.qty button, .free_qty button', function() {
			let _this=$(this).siblings('input');
			
			let obj_class=_this.parents('td').prop('class');
			// if field has moved to a child row
			if (obj_class=="child") {
				obj_class=_this.prop('name').replace(/[0-9]/g, '');
			} else {
				obj_class=obj_class.trim();
				obj_class += "_";
			}
			
			let row_id=_this.prop('name').replace(obj_class, '');
			let min=_this.prop('min');
			let max=_this.prop('max');
			let value=Number(_this.val());
			value=isNaN(value) ? 0 : value;
			
			if ($(this).hasClass('btn-increment')) {
				value++;
			} else if ($(this).hasClass('btn-decrement')) {
				value--;
			}
			
			if (value>=min && value<=max) {
				_this.val(value);
				calc_subtotal(row_id);
			}
		});
		
		$('table.dt tbody').on('blur', '.qty input, .free_qty input', function() {
			// if field has moved to a child row
			let obj_class=$(this).parents('td').prop('class');
			
			if (obj_class=="child") {
				obj_class=$(this).prop('name').replace(/[0-9]/g, '');
			} else {
				obj_class=obj_class.trim();
				obj_class+="_";
			}
			
			let row_id=$(this).prop('name').replace(obj_class, '');
			let min=$(this).prop('min');
			let max=$(this).prop('max');
			let value=Number($(this).val());
			value=isNaN(value) ? 0 : value;
			
			if (value<min) { value=min; }
			else if (value>max) { value=max; }
			
			value=parseInt(value);
			$(this).val(value);
			calc_subtotal(row_id);
		});
		
		if ( (role_group == "superuser" || role_group == "chains_agent") && user_data.allow_price_control) {
			let typingTimer;
			
			$('table.dt tbody').on('input', '.price input, .zagranitsa_price input', function() {
				const _this=$(this);
				
				// Clear previous timeout to avoid premature triggers
				clearTimeout(typingTimer);
				
				typingTimer = setTimeout(function() {
					let value=Number( _this.val() );
					value=isNaN(value) ? 0 : value;
					
					if (role_group == "chains_agent") {
						if ( value < _this.data('revert') ) {
							value = _this.data('revert');
						}
					}
					
					_this.val(value);
					
					let row=_this.parents('tr');
					if ( row.hasClass('child') ) row=row.prev('tr');
					
					const d=table.row( row ).data();
					let target=( _this.parents('td').hasClass('zagranitsa_price') ) ? 'zagranitsa_price' : 'price';
					
					d[ target ]=value;
					if ( $('body').hasClass('ws-order') ) d[ 'profit_base_' + target ]=value;
					
					table.row( row ).data( d ).draw('page');
				}, 1000);
			});
			
			$('table.dt tbody').on('click', '.price button.btn-revert, .zagranitsa_price button.btn-revert', function() {
				let input=$(this).siblings('input');
				input.val( input.data('revert') ).trigger('input');
			});
			
			$('table.dt tbody').on('click', '.price button.btn-save, .zagranitsa_price button.btn-save', async function() {
				let row=$(this).siblings('input').parents('tr');
				if ( row.hasClass('child') ) row=row.prev('tr');
				
				const d=table.row( row ).data();
				
				if (role_group == "chains_agent") {
					const row_id = d.id;
					calc_subtotal(row_id);
				}
				
				if (role_group == "superuser") {
					const price_list_id = ( $(this).parents('td').hasClass('zagranitsa_price') ) ? $('form#options input[name="zagranitsa_price_list"]').val() : dt.data('comax_price_list_id');
					const new_price=$(this).siblings('input').val();
					
					$(this).children('i').removeClass('fa-save').addClass('fa-spinner fa-spin');
					await setPrice(d.sku, price_list_id, new_price);
					$(this).children('i').removeClass('fa-spinner fa-spin').addClass('fa-save');
					
					let pricing_rule = '0.13';
					if (d.price <= 1 && d.zagranitsa_price == 0 && d.stock == 0 && d.suppliers_orders > 0) {
						pricing_rule = '0.15';
					} else if (d.price > 1 && d.zagranitsa_price > 0) {
						pricing_rule = '1.00';
					}
					
					$('select[name="pricing_rule-' + d.id + '"]').val( pricing_rule ).trigger('change');
					//table.cell( row.children('td.pricing-rule') ).data( pricing_rule );
				}
			});
			
			function setPrice(sku, price_list_id, price) {
				return new Promise((resolve, reject) => {
					$.getJSON('/api/set-price.php', { 'sku': sku, 'price_list_id': price_list_id, 'price': price }, (response) => {
						if (response.success) {
							bsToastGenerator('success', 'fa-regular fa-circle-check', lang.changes_saved_set_price.replace('{$sku}', sku));
						} else {
							bsToastGenerator('danger', 'fa-regular fa-triangle-exclamation', lang.apps_js_error_occured);
						}
						resolve( response.success );
					}).fail(reject);
				});
			}
		}
		
		if (role_group == "superuser") {
			$('table.dt tbody').on('click', '.weight button.btn-save', function(e) {
				const _this=$(this).siblings('input');
				let row=_this.parents('tr');
				if ( row.hasClass('child') ) row=row.prev('tr');
				
				const d=table.row( row ).data();
				const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
				const weight={ 'val': _this.val(), 'dt': timestamp };
				
				$.getJSON('/api/one-liner-db-writer.php', { 'action': 'update', 'db_table': 'products', 'db_where_col': 'sku', 'db_where_val': d.sku, 'col': 'weight', 'val': weight }).then(function(response) {
					if ( !response.hasOwnProperty('err') ) {
						table.cell( row.children('td.weight') ).data( weight ).draw('page');
						bsToastGenerator('success', 'fa-regular fa-circle-check', lang.changes_saved);
					} else {
						bsToastGenerator('danger', 'fa-regular fa-triangle-exclamation', lang.apps_js_error_occured);
					}
				});
			});
		}
		
		if (role_group == "wholesale") {
			getCustomersDebt(user_data.comax_customer_id);
		}
	}
	
	if ($('body').hasClass('ws-catalog-items-location')) {
		dt=$('#catalog-items-location');
		
		ajax={
			'url': '/api/location.php',
			'type': 'GET',
			'data': { 'sku': dt.data('sku'), 'stock_availability': 1, 'blacklist': 1 },
			'dataSrc': 'data'
		};
		
		columns=[
			{ 'data': "row" },
			{ 'data': "column" },
			{ 'data': "floor" },
			{
				'data': "qty",
				'render': $.fn.dataTable.render.number(',', '.'),
				'searchable': false
			}
		];
	}

	if ($('body').hasClass('ws-catalog-items-orders-by-customers')) {
		dt=$('#catalog-items-orders-by-customers');
		
		ajax={
			'url': 'ws-catalog-items-orders-by-customers-query.php',
			'type': 'GET',
			'data': { 'sku': dt.data('sku') },
			'dataSrc': 'data'
		};
		
		columns=[
			{ 'data': "doc_number" },
			{
				'data': "doc_date",
				'render': sortDate
			},
			{
				'name': "order_status",
				'data': "order_status",
				'render': fillBlanks
			},
			{ 'data': "customer_id" },
			{ 'data': "customer_name" },
			{
				'data': "qty",
				'render': $.fn.dataTable.render.number(',', '.'),
				'searchable': false
			}
		];
	}
	
	if ($('body').hasClass('ws-catalog-items-orders-by-suppliers')) {
		dt=$('#catalog-items-orders-by-suppliers');
		
		const data={
			'sku': dt.data('sku'),
			'supplier_id': dt.data('supplier_id'),
			'order_number': dt.data('order_number'),
			'order_date': dt.data('order_date')
		};
		
		ajax={
			'url': 'ws-catalog-items-orders-by-suppliers-query.php',
			'type': 'GET',
			'data': data,
			'dataSrc': 'data'
		};
		
		if ( dt.data('sku') ) {
			columns=[
				{ 'data': "supplier_id" },
				{
					'data': "supplier_name",
					'render': (data, type, row) => (type==='display') ? '<a class="link-dark" href="/apps/wholesale/ws-catalog-items-orders-by-suppliers.php?supplier_id=' + row.supplier_id + '" role="button">' + data + '</a>' : data
				},
				{
					'data': "doc_number",
					'render': (data, type, row) => (type==='display') ? '<a class="link-dark" href="/apps/wholesale/ws-catalog-items-orders-by-suppliers.php?order_number=' + data + '&order_year=' + moment(row.doc_date, "DD/MM/YYYY").year() + '" role="button">' + data + '</a>' : data
				},
				{ 'data': "doc_date" },
				{
					'defaultContent': "",
					'render': (data, type, row) => $.fn.dataTable.render.number(',', '.', 2, row.supplier_currency_symbol).display(row.total_price / row.total_qty),
					'searchable': false
				},
				{
					'data': "total_qty",
					'render': $.fn.dataTable.render.number(',', '.'),
					'searchable': false
				},
				{
					'data': "total_price",
					'render': (data, type, row) => $.fn.dataTable.render.number(',', '.', 2, row.supplier_currency_symbol).display(data),
					'searchable': false
				},
				{
					'data': "total_qty_supplied",
					'render': $.fn.dataTable.render.number(',', '.'),
					'searchable': false
				}
			];
		}
		
		if ( dt.data('supplier_id') || dt.data('order_number') ) {
			colVisibility={
				'doc_number': true,
				'doc_date': true
			};
			
			if (dt.data('order_number')) {
				colVisibility.doc_number=false;
				colVisibility.doc_date=false;
			}
			
			columns=[
				{
					'data': "doc_number",
					'visible': colVisibility.doc_number,
					'render': (data, type, row) => (type==='display') ? '<a class="link-dark" href="/apps/wholesale/ws-catalog-items-orders-by-suppliers.php?order_number=' + data + '&order_year=' + moment(row.doc_date, "DD/MM/YYYY HH:mm").year() + '" role="button">' + data + '</a>' : data
				},
				{
					'data': "doc_date",
					'visible': colVisibility.doc_date
				},
				{
					'data': "sku",
					'render': (data, type, row) => (type==='display') ? '<a class="link-dark" href="/apps/wholesale/ws-catalog-items-orders-by-suppliers.php?sku=' + data + '" role="button">' + data + '</a>' : data,
				},
				{ 'data': "product_name" },
				{
					'data': "price",
					'render': (data, type, row) => $.fn.dataTable.render.number(',', '.', 2, row.supplier_currency_symbol).display(data),
					'searchable': false
				},
				{
					'data': "qty",
					'render': $.fn.dataTable.render.number(',', '.'),
					'searchable': false
				},
				{
					'defaultContent': "",
					'render': (data, type, row) => $.fn.dataTable.render.number(',', '.', 2, row.supplier_currency_symbol).display(row.price * row.qty),
					'searchable': false
				},
				{
					'data': "qty_supplied",
					'render': $.fn.dataTable.render.number(',', '.'),
					'searchable': false
				}
			];
		}
	}
	
	if ( $('body').hasClass('ws-catalog-items-location') || $('body').hasClass('ws-catalog-items-orders-by-customers') || $('body').hasClass('ws-catalog-items-orders-by-suppliers') ) {
		const opts={
			'ajax': ajax,
			'columns': columns,
			'dom': '<"#filters.row gy-3"<"col-auto"f><"col-auto"B>><"row"<"col-12"t>><"row"<"col-12 col-md-7"i><"col-12 col-md-5"p>>',
			'buttons': [
				{
					'extend': 'excel',
					'title': '',
					'text': '<i class="fa-regular fa-file-excel me-1"></i>Excel',
					'className': 'btn-sm',
					'exportOptions': {
						'columns': ':not(.no-export):visible',
						'orthogonal': 'export'
					}
				},
				{
					'text': '<i class="fa-solid fa-rotate-right me-1"></i>' + lang.apps_js_reset_btn,
					'className': 'btn-sm',
					'action': resetDataTablesFilters
				}
			],
			'footerCallback': fooSum,
			'responsive': {
				'breakpoints': breakpoints,
				'details': {
					'type': 'column',
					'target': 'tr'
				}
			},
			'pageLength': 50,
			'lengthChange': false,
			'scrollToTop': true
		};
		
		if (lang_code==="he") {
			opts.language={
				'url': "/assets/js/dataTables.he.json"
			};
		}
		
		if ( $('body').hasClass('ws-catalog-items-orders-by-customers') ) {
			let def;
			
			if ( $('table.dt').is('[data-src]') ) {
				if ( $('table.dt').data('src') == "orders-blockers" ) {
					def = 'מאושרת';
				}
			}
			
			opts.dom='<"#filters.row gy-3"<"col-auto"<"#status">><"col-auto"f><"col-auto"B>><"row"<"col-12"t>><"row"<"col-12 col-md-7"i><"col-12 col-md-5"p>>',
			opts.initComplete=function(settings, json) {
				tom_select_builder(this, 'status', lang.mj_fox_js_filters_status_label, 'order_status', def);
			};
		}
		
		table=dt.DataTable(opts);
	}
}

/**
	Begin
	Functions
*/
const max_visible_stock=Number( $('form#options input[name="max_visible_stock"]').val() );
const max_visible_true_stock_allowed=Number( $('form#options input[name="max_visible_true_stock_allowed"]').val() );

function calc_subtotal(row_id) {
	const row = $('table.dt tr#row_' + row_id);
	const row_data = table.row('#row_' + row_id).data();
	const qty = Number( $('input[name="qty_' + row_id + '"]:visible').val() );
	
	if ( qty < 1 && $('body').hasClass('ws-checkout') ) {
		row.find('.trash button.btn-trash').trigger('click');
		return false;
	}
		
	let price = row.data('price');
	let discount = 0;
	let free_qty = 0;
	
	if (user_data.allow_price_control && ( role_group == "superuser" || ($('body').hasClass('ws-checkout') && role_group == "chains_agent") ) ) {
		price = Number( $('input[name="price_' + row_id + '"]:visible').val() );

		if ( role_group == "chains_agent" && row_data.formula ) {
			price = calc_formula_price(row_data.original_price, qty );
		}
	}

	if ( $('body').hasClass('ws-checkout') ) {
		if (role_group == "superuser" || role_group == "wholesale_agent")
			discount = Number( $('input[name="discount_' + row_id + '"]:visible').val() );

		if (role_group == "superuser" || role_group == "wholesale_agent" || role_group == "chains_agent")
			free_qty = Number( $('input[name="free_qty_' + row_id + '"]:visible').val() );
	}

	let subtotal = qty * price;
	if (discount > 0) subtotal = ( 1 - (discount / 100) ) * subtotal;
	
	$('input[name="subtotal_' + row_id + '"]').val( formatPrice(subtotal) );

	const cart = subtotal > 0 ? "include" : "exclude";

	const changes = {
		'qty': qty,
		'price': price,
		'subtotal': subtotal,
		'discount': discount,
		'free_qty': free_qty
	};

	row.data(changes).attr('data-cart', cart);

	changes.cart = cart;

	if ( $('body').hasClass('ws-checkout') ) {
		const cd = { ...row_data, ...changes };
		table.row('#row_' + row_id).data(cd).draw();
	}

	calc_shopping_cart(false, true);
}

function calc_formula_price(price, qty) {
	return (qty < 6) ?
		price :
		Math.round( price * ( qty + 1 ) / qty );
}

async function calc_shopping_cart(keep=false, bundle=false) {
	let cart_content_count=0;
	let cart_total=0;
	let cart_total_cost=0;
	const cart_content=[];
	const cart_bundles=[];
	
	table.rows().every( function (rowIdx, tableLoop, rowLoop) {
		const _this=$( this.node() );
		if (_this.attr('data-cart') == "include") {
			let allowed=true;
			if ( $('#checkout').length && this.data().created_via==="bundle" ) allowed=false;
			
			if (allowed===true) {
				const id=_this.prop('id').replace('row_', '');
				const qty=_this.data('qty');
				const price=parseFloat( _this.data('price') );
				const subtotal=parseFloat( _this.data('subtotal') );
				const discount=parseFloat( _this.data('discount') );
				const free_qty=_this.data('free_qty');

				const value={
					'id': id,
					'qty': qty,
					'price': price,
					'subtotal': subtotal,
					'discount': discount,
					'free_qty': free_qty
				};
				
				cart_content.push(value);
				cart_content_count += qty;
				cart_total_cost += qty * _this.data('cost_price');
				cart_total += subtotal;
				
				if ($('#checkout').length && bundle===true && this.data().on_bundle==true) {
					const bundle=check_bundle_eligibility(this.data(), qty);
					if (bundle.qty > 0) cart_bundles.push(bundle);
				}
			}
		}
	} );
	
	if ($('#checkout').length) {
		const order_params={};
		
		if (role_group==="superuser" || role_group==="wholesale_agent" || role_group==="chains_agent") {
			if ($('#order_status').length) { if ( $('#order_status').val() ) order_params.order_status=$('#order_status').val(); }
			
			const customer=Cookies.get('customers_behalf');
			if (customer!==undefined) {
				const obj=JSON.parse(customer);
				$('#order-btn .btn-text').html(lang.wholesale_checkout_order_summary_submit + ' <span class="d-none d-sm-inline">' + lang.wholesale_checkout_order_summary_submit_customers_behalf + ' '+ obj.name + '</span>');
			}
		}
		
		if (role_group==="superuser" || role_group==="wholesale_agent") {
			let cart_total_before_discount=cart_total;
			let cart_discount=$('#cart-discount input').val();

			if (cart_discount>0) {
				cart_total=(1-(cart_discount/100))*cart_total_before_discount;
				
				$('#cart-total-before-discount .price .amount').text( formatPrice(cart_total_before_discount) );
				$('#cart-total-before-discount').parents('li').removeClass('d-none');
				
				order_params.cart_total_before_discount=cart_total_before_discount;
				order_params.discount=cart_discount;
			} else {
				$('#cart-total-before-discount .price .amount').text( formatPrice(cart_total) );
				$('#cart-total-before-discount').parents('li').addClass('d-none');
			}
		}
		
		// not a Заграница customer
		if (user_data.comax_customer_group_id!=1120600) {
			$('#cart-total-vat, #cart-total-plus-vat').parents('li').removeClass('d-none');
			let vat=$('input[name="vat"]').val()/100;
			let cart_total_vat=Math.round(cart_total*vat);
			let cart_total_plus_vat=cart_total+cart_total_vat;
			$('#cart-total-vat .price .amount').text( formatPrice(cart_total_vat) );
			$('#cart-total-plus-vat .price .amount').text( formatPrice(cart_total_plus_vat) );
		}
		
		if ($('#shipping_method').length) {
			if ( $('#shipping_method').val() ) order_params.shipping_method=$('#shipping_method').val();
		}
		
		if ($('#order_notes').length) {
			if ( $('#order_notes').val() ) order_params.order_notes=$('#order_notes').val();
		}
		
		if ($('#order_details').length) {
			if ( $('#order_details').val() ) order_params.order_details=$('#order_details').val();
		}
		
		order_params.cart_total=cart_total;

		if (keep===false) Cookies.set( 'order_params', JSON.stringify(order_params), { 'expires': 1, 'secure': true, 'sameSite': 'Lax' } );
		if (bundle===true) Cookies.set( 'cart_bundles', JSON.stringify(cart_bundles), { 'expires': 1, 'secure': true, 'sameSite': 'Lax' } );

		let min_cart_total_limit=Number( $('form#options input[name="min_cart_total_limit"]').val() );
		
		// not ILS
		if (local_currency != curr_currency) min_cart_total_limit *= currencies[ local_currency ].rate;
		
		const state = ( cart_content_count <= 0 || cart_total <= 0 || (user_data.min_cart_total_limit && cart_total < min_cart_total_limit) ) ? true : false;
		$('#order-btn').prop('disabled', state);
	}
	
	if (keep===false) {
		const response=await $.ajax({
			'url': 'ws-cart.php',
			'type': 'POST',
			'dataType': 'json',
			'data': {
				'cart_content': JSON.stringify(cart_content)
			}
		});
		
		if (response.success === false) {
			bsToastGenerator('warning', 'fa-solid fa-exclamation-circle', response.message);
			table.ajax.reload(null, false);
			return false;
		}
	}
	
	$('#cart-content-count').text( formatPrice(cart_content_count) );
	$('#cart-total .price .amount').text( formatPrice(cart_total) );
	
	if ($('#checkout').length && role_group==="superuser") {
		let total_gross_margin=calc_gross_margin(cart_total, cart_total_cost);
		$('#cart-gross-margin').html('<bdi class="'+total_gross_margin.text_color+'">'+total_gross_margin.percentage.toFixed(2)+'%</bdi>');
	}
}

function check_bundle_eligibility(row_data, base_qty) {
	let bundle_eligible_qty=Math.floor(base_qty/row_data.bundle_qty);
	
	let bundle=row_data.bundle_metadata;
	let DT_RowId='row_' + bundle.id;
	
	// if row exists
	if ( table.rows('[id='+DT_RowId+']').any() ) {
		if (bundle_eligible_qty>0) {
			let pos=$('tr#'+DT_RowId+' td.qty');
			table.cell(pos).data(bundle_eligible_qty).draw();
		} else {
			table.row('tr#'+DT_RowId).remove().draw();
		}
	} else if (bundle_eligible_qty>0) {
		let d={
			'DT_RowId': DT_RowId,
			'id': bundle.id,
			'sku': bundle.sku.toString(),
			'img': bundle.img,
			'product_name': bundle.product_name,
			'product_name_en': bundle.product_name_en,
			'brand_en': bundle.brand_en,
			'stock': bundle.stock,
			'price': 0,
			'qty': bundle_eligible_qty,
			'subtotal': 0,
			'original_price': bundle.original_price,
			'on_bundle': bundle.on_bundle,
			'created_via': "bundle"
		};
		
		if (role_group==="superuser") {
			d.gross_margin=bundle.gross_margin;
			d.cost_price=bundle.cost_price
		}
		
		if (role_group==="superuser" || role_group==="wholesale_agent") {
			d.discount=bundle.discount;
		}
		
		if (role_group==="superuser" || role_group==="wholesale_agent" || role_group==="chains_agent") {
			d.free_qty=bundle.free_qty;
		}
		
		table.row.add(d).draw();
	}
	
	return { 'id': bundle.id, 'qty': bundle_eligible_qty }
}

function empty_shopping_cart() {
	$.post('ws-cart.php', { 'cart_content': JSON.stringify([]) }, response => {
		top.window.location.href = 'ws-order.php';
	}, 'json');
}

function set_available_qty(stock) {
	let max=9000;
	if (role_group!=="superuser") {
		let limit_by=max_visible_stock;
		if (user_data.allow_true_stock==1) limit_by=max_visible_true_stock_allowed; // 1=limited, 2=full
		if (stock < limit_by) max=stock;
	}
	return max;
}

function reset_selected_customer() {
	Cookies.remove('customers_behalf');
	reset_last_prices();
	toggleCustomersDebt('hide');
	toggleMonthlySales('hide');
}

function reset_last_prices() {
	document.querySelectorAll('.last-price input').forEach(function(input) {
		input.value = '';
	});

	document.querySelectorAll('.last-price button.btn-timestamp').forEach(function(btn) {
		const instance = bootstrap.Tooltip.getInstance(btn);
		if (instance)
			instance.dispose();

		btn.disabled=true;
		btn.removeAttribute('data-bs-title');
	});
};

function getCustomersDebt(customer_id) {
	$.getJSON('/api/customers-debt.php', { 'customer_id': customer_id }).done(function(response) {
		if (response.total>0) {
			toggleCustomersDebt('show', customer_id, response.total);
		} else {
			toggleCustomersDebt('hide');
		}
		
		if (role_group!="wholesale") {
			toggleMonthlySales('show', customer_id, response);
		} else {
			toggleMonthlySales('hide');
		}
	});
}

function toggleCustomersDebt(action, customer_id='', total=0) {
	if (action=="show") {
		$('#customers-debt-summary-btn').prop('href', '/apps/50-cent/50c-open-docs.php?customer_id=' + customer_id);
		$('#customers-debt-info-total').html( currencies[ local_currency ].symbol + formatPrice(total) );
		$('#customers-debt').removeClass('d-none');
	} else {
		$('#customers-debt-summary-btn').prop('href', 'javascript:void(0);');
		$('#customers-debt').addClass('d-none');
	}
}

function toggleMonthlySales(action, customer_id = '', metadata = []) {
	if (action=="show") {
		let recent_order;

		if(metadata.recent_order != null) {
			const days_passed = moment().diff(metadata.recent_order, 'days');

			if(days_passed <= 1)
				recent_order = tiny_purge(lang['dashboard_yesterday']);
			else if(days_passed === 2)
				recent_order = tiny_purge(lang['dashboard_two_days_ago']);
			else
				recent_order = lang['dashboard_x_days_ago'].replace('{$days_passed}', days_passed);
		}
		else {
			recent_order = tiny_purge(lang.beyonce_js_filters_recent_order_option_off);
		}
		
		$('#customers-monthly-sales-info-total').html( currencies[ local_currency ].symbol + formatPrice( Math.trunc(metadata.monthly_sales) ) );
		$('#customers-monthly-sales-info-recent-order').html( recent_order );
		$('#customers-monthly-sales').removeClass('d-none');
	} else {
		$('#customers-monthly-sales').addClass('d-none');
	}
}

function fetchImageAndDownload(url, downloadName) {
	//e.preventDefault(); // Prevent browser's default download stuff...

	//const url=this.getAttribute("href");       // Anchor href 
	//const downloadName=this.download;          // Anchor download name

	const img=document.createElement("img");   // Create in-memory image
	img.addEventListener("load", () => {
		const a=document.createElement("a");   // Create in-memory anchor
		a.href=img.src;                        // href toward your server-image
		a.download=downloadName;               // :)
		a.click();                               // Trigger click (download)
	});
	img.src='/api/fetch-image.php?url='+ url;       // Request image from your server

}

function generateBarcode(sku) {
	$("#barcode").JsBarcode(sku, { 'format': "EAN13" } );
	Fancybox.show([{ src: "#barcode-container", type: "inline" }]);
}

function activateBanner(id, viewport) {
	$.get('/api/banners-stats.php', { 'banner_id': id, 'viewport': viewport });
}

function formatProfitPercentage(selling_price, buying_price, type) {
	const percentage = (selling_price>0 && buying_price>1) ? Math.round( (1 - (buying_price/selling_price)) * 100 ) : 0;
	const text_color = (percentage<1) ? "text-danger" : "text-success";
	
	return (type==='display') ?
		'<bdi class="' + text_color + '">' + $.fn.dataTable.render.number(',', '.', 0, '', '%').display(percentage) + '</bdi>' :
		percentage;
}

function formatProductName(data, type, row, meta) {
	if (type==='display') {
		let ret=data;
		
		//if (row.new_arrival) ret += '<span class="badge text-bg-warning ms-2" title="' + lang.wholesale_js_new_badge + '"><i class="fa-solid fa-fire me-1"></i>' + lang.wholesale_js_new_badge + '</span>';
		
		if ( !(role_group == "superuser" && meta.settings.aoColumns[ meta.col ].name == "product_name_en") ) {
			if (row.on_bundle) {
				let title=row.bundle_qty + '+' + lang.wholesale_js_free_gift;
				ret += '<span class="badge text-bg-purple-rain ms-2" title="' + title + '"><i class="fa-solid fa-gift me-1"></i>' + title + '</span>';
			}
		
			if ( dt.data('official_brands').includes(row.brand_en) ) ret += '<span class="badge bg-danger ms-2" title="' + lang.wholesale_order_thead_official_importer + '"><i class="fa-solid fa-comet me-1"></i>' + lang.wholesale_order_thead_official_importer + '</span>';
			
			if ( row.price_changelog.full_name.length) {
				if (row.price_changelog.text > row.price) {
					ret += '<span class="badge text-bg-greenfields ms-2" title="' + tiny_purge(lang.wholesale_order_thead_price_drop) + '">' +
						'<i class="fa-solid fa-arrow-trend-down me-1"></i>' +
						tiny_purge(lang.wholesale_order_thead_price_drop) +
					'</span>';
				}
			}
		}
		
		return ret;
	}
	return data;
}

function formatPrice(num, currency_symbol='') {
	num=parseFloat(num);
	const dec = !Number.isInteger(num) ? 2 : 0;
	return $.fn.dataTable.render.number(',', '.', dec, currency_symbol).display(num);
}

function renderPriceControlComponent(data, type, row, col, currency, condition) {
	if (type === 'display' && condition) {
		let btn_revert="btn-outline-secondary";
		if ( data != row['original_' + col] ) btn_revert="btn-warning";
		
		return '<div class="input-group input-group-sm">' +
			'<button type="button" class="btn ' + btn_revert + ' btn-revert"><i class="fa-solid fa-history "></i></button>' +
			'<input type="text" class="form-control" name="' + col + '_' + row.id + '" value="' + data + '" data-revert="' + row['original_' + col] + '" onclick="javascript:this.setSelectionRange(0, this.value.length)">' +
			'<button type="button" class="btn btn-outline-secondary btn-save"><i class="fa-solid fa-save "></i></button>' +
		'</div>';
	}
	
	let currency_symbol=currency;
	if ( $('body').hasClass('ws-order') ) currency_symbol=currencies[ $('form#options input[name="' + currency + '"]').val() ].symbol;
	
	return formatPrice(data, currency_symbol);
}

function iOS() {
	return [
		'iPad',
		'iPhone',
		'iPod'
	].includes(navigator.platform)
	// iPad on iOS 13 detection
	|| (navigator.userAgent.includes("Mac") && "ontouchend" in document)
}
/**
	End
	Functions
*/