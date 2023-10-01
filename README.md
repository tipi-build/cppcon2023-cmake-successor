# CMake Successor Build Systems: A World Tour of Build Systems Towards Better C++ Builds

Recently the C++ community is all about safety and new “successors” programming languages are popping up like Cpp2, Carbon, Val and others to complement C++ towards software security and memory safety.

While it’s very beneficial to design new languages features to support safety, it is equally important to have proper tooling. One key aspect of a programming language’s usability and safety is how the code written can be shipped to end-users and how the software supply chain security can be guaranteed. 

Happily the C++ community has been unifying in the last decade from various build systems on CMake. Despite it’s massive adoption it is still criticized for reasons ranging from it’s turing-completeness to the fragmentation of the different CMake styles across codebases. It also lacks important features than newer build systems provide: dependency management, SBOM (Software Bill Of Material) generation, reproducible, hermetic and remote builds.

Newer potential “successors” build systems for C++ (e.g. bpt, GN, Meson, BuildCC) but also polyglot build systems like Bazel and Gradle have been designed to overcome these issues. In this talk we will analyze which choices were made and which benefits they offer. Finally looking at how software supply chain security, static+dynamic code analysis, reproducible, hermetic and remote builds are achieved in their ecosystem.

After looking at an overview of the design decisions and benefits that these “successors” build systems provides, we will identify best practices and provide pragmatic solutions to get all of this today with CMake. 

To prove our point we will finally demo SBOM generation, build reproducibility to the single byte and remote builds on a large CMake codebase.

## Talk outline
1. Definition of Safety in software builds and distribution
2. Introduction and overview of the impact of the build systems and tooling on languages considered safe 
	* The Rust language that is currently taking significant traction came incidentally also with a new build and packaging ecosystem. For the C++ community to reach even better safety, it should invest heavily in its tooling.
	* In this section we cover why language design is not enough and how tooling makes a different ( e.g. how miri does more for Rust safety than the borrow-checker ) 
	* We look which impact fuzzing, static+dynamic code analysis has on safety for many C++ codebases

3. Various new build systems, design decisions, benefits and drawbacks.
The goal is to present for each the key design principles and the contexts they were born.
	* Bazel
	* Gradle
	* GN
	* Meson
	* BuildCC
	* Bpt
	* Fastbuild
	* CMake

4.	We finally take the LLVM + Clang codebase and modernize it live with appropriate tooling to provide:
	* Dependency Management with CMake
	* SBOM (Software Bill Of Material) for CMake builds
	* Build Provenance metadata generation for CMake 
	* Leveraging toolchain files for hermetic and reproducible builds with CMake 
	* Remote Builds and reliable Caching for each build action
	* Static and Dynamic code analysis integration in CMake
	* Introduction of a CMake Linter to help enforce a style for safety


