module.exports = function(grunt) {

  grunt.initConfig({
    responsive_images: {
      dev: {
        options: {
          engine: 'im',
          sizes: [{
            width: 300,
            suffix: '_small',
            quality: 30
          }]
        },
        files: [{
          expand: true,
          src: ['*.{gif,jpg,png}'],
          cwd: 'img/',
          dest: 'img2/'
        }]
      }
    },

    /* Clear out the images directory if it exists */
    clean: {
      dev: {
        src: ['img2'],
      },
    },

    /* Generate the images directory if it is missing */
    mkdir: {
      dev: {
        options: {
          create: ['img2']
        },
      },
    },

    /* Copy the "fixed" images that don't go through processing into the images/directory */
    copy: {
      dev: {
        files: [{
          expand: true,
          src: ['img/fixed/*.{gif,jpg,png}'],
          dest: 'img2/',
          flatten: true,
        }]
      },
    },

    /* js minify */
    uglify: {
       my_target1: {
          files: {
             'sw.min.js': ['sw.js'],
          }
       },
       my_target2: {
          files: {
             'dest/main.js': ['js/dbhelper.js', 'js/main.js'],
          }
       },
       my_target3: {
          files: {
             'dest/restaurant_info.js': ['js/dbhelper.js', 'js/restaurant_info.js'],
          }
       }
    },

    /* css minify */
    cssmin: {
      my_target: {
        src: 'css/styles.css',
        dest: 'dest/styles.css'
      }
    },

  });

  grunt.loadNpmTasks('grunt-responsive-images');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-mkdir');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify-es');

  grunt.registerTask('default', ['clean', 'mkdir', 'copy', 'responsive_images']);
  grunt.registerTask('minify', ['cssmin', 'uglify']);
};
