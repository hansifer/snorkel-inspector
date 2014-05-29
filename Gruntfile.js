module.exports = function(grunt) {

	var baseUrl_src = '//hansifer.github.io/snorkel-inspector/src/';
	var baseUrl_dist = '//hansifer.github.io/snorkel-inspector/dist/bookmarklet/';

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		banner: '// <%= pkg.title || pkg.name %> <%= pkg.version %>' /*+ ' - ' + '<%= grunt.template.today("yyyy-mm-dd") %>'*/ + '\n' + '<%= pkg.homepage ? "// " + pkg.homepage + "\\n" : "" %>' + '// (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' + ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %>\n',
		jshint: {
			gruntfile: {
				src: 'Gruntfile.js',
				options: {
					jshintrc: '.jshintrc'
				}
			},
			src: {
				src: ['src/*.js', 'src/js/snorkelInspector.js'],
				options: {
					jshintrc: '.jshintrc'
				}
			}
		},
		clean: {
			dist_bookmarklet: ['dist/bookmarklet/*'],
			dist_chrome_extension: ['dist/chrome_extension/*'],
			test: ['test/*']
		},
		copy: {
			dist_bookmarklet_js_modernizr: {
				expand: true,
				cwd: 'src/js/',
				src: ['modernizr-2.6.2.min.js'],
				dest: 'dist/bookmarklet/js/',
				filter: 'isFile'
			},
			// dist_bookmarklet_js: {
			// 	expand: true,
			// 	cwd: 'src/',
			// 	src: ['ui_overlay.js'],
			// 	dest: 'dist/bookmarklet/',
			// 	filter: 'isFile'
			// },
			// dist_bookmarklet_fonts: {
			// 	expand: true,
			// 	cwd: 'src/fonts/',
			// 	src: '*',
			// 	dest: 'dist/bookmarklet/fonts/',
			// 	filter: 'isFile'
			// },
			dist_bookmarklet_images: {
				expand: true,
				cwd: 'src/images/',
				src: '*',
				dest: 'dist/bookmarklet/images/',
				filter: 'isFile'
			},
			dist_chrome_extension_js_modernizr: {
				expand: true,
				cwd: 'src/js/',
				src: ['modernizr-2.6.2.min.js'],
				dest: 'dist/chrome_extension/js/',
				filter: 'isFile'
			},
			// dist_chrome_extension_fonts: {
			// 	expand: true,
			// 	cwd: 'src/fonts/',
			// 	src: '*.woff',
			// 	dest: 'dist/chrome_extension/fonts/',
			// 	filter: 'isFile'
			// },
			dist_chrome_extension_images: {
				expand: true,
				cwd: 'src/images/',
				src: '*',
				dest: 'dist/chrome_extension/images/',
				filter: 'isFile'
			},
			dist_chrome_extension_additions: {
				expand: true,
				cwd: 'src/chrome_extension_additions/',
				src: ['**'],
				dest: 'dist/chrome_extension/'
			},
			test: {
				expand: true,
				cwd: 'src/',
				src: ['css/**', 'css_overlay/**', 'images/checkmark.gif', 'js/**'],
				dest: 'test/'
			}
		},
		concat: {
			dist_bookmarklet_js: {
				options: {
					separator: grunt.util.linefeed
				},
				src: ['src/js/polyfill_addEventListener.js', 'src/js/jquery.custom.js', 'src/js/jquery.scrollIntoView.mod.js', 'src/js/plugins.js', 'src/js/bootstrap.custom.js', 'src/js/underscore.js', 'src/js/dab.js', 'src/js/domDab.js', 'src/js/uuid.js', 'src/js/browserDab.js', 'src/js/originEvents.dep.js', 'src/js/snorkel.dep.js', 'src/js/snorkelInspector.js'],
				dest: 'dist/bookmarklet/js/combo.js'
			},
			dist_chrome_extension_js: {
				options: {
					separator: grunt.util.linefeed
				},
				src: ['src/js/polyfill_addEventListener.js', 'src/js/jquery.custom.js', 'src/js/jquery.scrollIntoView.mod.js', 'src/js/plugins.js', 'src/js/bootstrap.custom.js', 'src/js/underscore.js', 'src/js/dab.js', 'src/js/domDab.js', 'src/js/uuid.js', 'src/js/browserDab.js', 'src/js/originEvents.dep.js', 'src/js/snorkel.dep.js', 'src/js/snorkelInspector.js'],
				dest: 'dist/chrome_extension/js/combo.js'
			},
			process_html_source_src: {
				options: {
					process: function(src, filepath) {
						return srcReplace(src, baseUrl_src, function(content) {
							return content.replace(/\bcss_page\//g, 'css_overlay/');
						});
					}
				},
				files: {
					'src/ui_overlay.js': ['src/ui_overlay.js'],
				}
			},
			process_html_source_dist_bookmarklet: {
				options: {
					process: function(src, filepath) {
						return srcReplace(src, baseUrl_dist, function(content) {
							return content.replace(
								/(<link\s+rel="stylesheet"\s+href="\'\s*\+\s*iframe_baseUrl\s*\+\s*\'[^\/]+?\/.+?\.css">\s*)+/, '<link rel="stylesheet" href="\' + iframe_baseUrl + \'css/combo.css">').replace(
								/(<script\s+src="\'\s*\+\s*iframe_baseUrl\s*\+\s*\'js\/(?!modernizr).+?\.js"><\/script>\s*)+/, '<script src="\' + iframe_baseUrl + \'js/combo.js"></script>');
						});
					}
				},
				files: {
					'dist/bookmarklet/ui_overlay.js': ['src/ui_overlay.js'],
				}
			},
			process_html_source_dist_chrome_extension: {
				options: {
					process: function(src, filepath) {
						return srcReplace(src, '', function(content) {
							return content.replace(
								/(<link\s+rel="stylesheet"\s+href="\'\s*\+\s*chrome.extension.getURL\(\s*"[^\/]+?\/.+?\.css"\s*\)\s*\+\s*\'">\s*)+/, '<link rel="stylesheet" href="\' + chrome.extension.getURL("css/combo.css") + \'">').replace(
								/(<script\s+src="\'\s*\+\s*chrome.extension.getURL\(\s*"js\/(?!modernizr).+?\.js"\s*\)\s*\+\s*\'"><\/script>\s*)+/, '<script src="\' + chrome.extension.getURL("js/combo.js") + \'"></script>');
						}, function(p1, p2) {
							return '<link rel="stylesheet" href="\' + chrome.extension.getURL("' + p1 + '/' + p2 + '.css") + \'">';
						}, function(p1) {
							return '<script src="\' + chrome.extension.getURL("js/' + p1 + '.js") + \'"></script>';
						});
					}
				},
				files: {
					'dist/chrome_extension/ui_overlay.js': ['src/ui_overlay.js'],
				}
			},
			process_html_source_test_overlay: {
				options: {
					process: function(src, filepath) {
						return src.replace(/\bcss_page\//g, 'css_overlay/');
					}
				},
				files: {
					'test/test_overlay.html': ['src/ui_source.html'],
				}
			}
		},
		cssmin: {
			dist_bookmarklet: {
				options: {
					preserveComments: 'some'
				},
				files: {
					'dist/bookmarklet/css/combo.css': ['src/css/normalize.css', 'src/css/main.css', 'src/css_overlay/bootstrap.mod.css', 'src/css_overlay/snorkelInspector.css']
				}
			},
			dist_chrome_extension: {
				options: {
					preserveComments: 'some'
				},
				files: {
					'dist/chrome_extension/css/combo.css': ['src/css/normalize.css', 'src/css/main.css', 'src/css_overlay/bootstrap.mod.css', 'src/css_overlay/snorkelInspector.css']
				}
			}
		},
		uglify: {
			dist_combo_bookmarklet: {
				options: {
					preserveComments: 'some'
				},
				src: 'dist/bookmarklet/js/combo.js',
				dest: 'dist/bookmarklet/js/combo.js'
			},
			dist_combo_chrome_extension: {
				options: {
					preserveComments: 'some'
				},
				src: 'dist/chrome_extension/js/combo.js',
				dest: 'dist/chrome_extension/js/combo.js'
			},
			dist_bookmarklet: {
				options: {
					preserveComments: 'some'
				},
				src: 'dist/bookmarklet/ui_overlay.js',
				dest: 'dist/bookmarklet/ui_overlay.js'
			},
			dist_chrome_extension: {
				options: {
					preserveComments: 'some'
				},
				src: 'dist/chrome_extension/ui_overlay.js',
				dest: 'dist/chrome_extension/ui_overlay.js'
			}
		},
		usebanner: {
			dist_bookmarklet: {
				options: {
					position: 'top',
					banner: '<%= banner %>\n',
					linebreak: false
				},
				files: {
					src: 'dist/bookmarklet/ui_overlay.js'
				}
			},
			dist_chrome_extension: {
				options: {
					position: 'top',
					banner: '<%= banner %>\n',
					linebreak: false
				},
				files: {
					src: 'dist/chrome_extension/ui_overlay.js'
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-banner');

	grunt.registerTask('default', ['jshint', 'clean', 'copy', 'concat', 'cssmin', 'uglify', 'usebanner']);

	function getContent(cssTrans, jsTrans) {
		if (!cssTrans) {
			cssTrans = function(p1, p2) {
				return '<link rel="stylesheet" href="\' + iframe_baseUrl + \'' + p1 + '/' + p2 + '.css">';
			};
		}
		if (!jsTrans) {
			jsTrans = function(p1) {
				return '<script src="\' + iframe_baseUrl + \'js/' + p1 + '.js"></script>';
			};
		}
		return grunt.file.read('src/ui_source.html').replace(/[\n\r]+/g, '').replace(/ +/g, ' ').replace(/<link\s+rel="stylesheet"\s+href="((?!http\:\/\/netdna\.bootstrapcdn)[^\/]+?)\/(.+?)\.css">/g, function(match, p1, p2) {
			return cssTrans(p1, p2);
		}).replace(/<script\s+src="js\/(.+?)\.js"><\/script>/g, function(match, p1) {
			return jsTrans(p1);
		}).replace(/<link\s+rel="shortcut icon".+?>/, '').replace(/\bhttp\:\/\/netdna\.bootstrapcdn\.com\/font-awesome\/.+?\.css/, function(match) {
			return '\' + normalizeUrl(\'' + match + '\') + \'';
		});
	}

	function srcReplace(src, url, transContent, cssTrans, jsTrans) {
		if (!transContent) {
			// default to identity fct
			transContent = function(content) {
				return content;
			};
		}

		return src.replace(/\b(iframe_baseUrl\s*=\s*["']).+?(["'].*[\n\r]+)/, function(match, p1, p2) {
			return p1 + url + p2;
		}).replace(/\b(content\s*=\s*).+?([\n\r]+)/, function(match, p1, p2) {
			return p1 + '\'' + transContent(getContent(cssTrans, jsTrans)) + '\';' + p2;
		});
	}
};
